import { describe, expect, it, vi } from 'vitest';
import type { MarkId } from '../core/ids';
import { emptyState } from '../core/model/defaults';
import type { Hex, SiteMarkState } from '../core/model/schema';
import type { TabStatus } from '../core/render/status';
import { anElementMark, aSiteGroup, aState, aWildcardPattern } from '../core/testing/builders';
import { fixedIdGen } from '../core/testing/test-doubles';
import { type BackgroundPorts, createBackgroundApp } from './background-app';
import type { LoadedState } from './ports';
import type { ContentSender } from './protocol';
import { createInMemoryBadge } from './testing/in-memory-badge';
import { createInMemoryLogger } from './testing/in-memory-logger';
import { createInMemoryPermissions } from './testing/in-memory-permissions';
import { createInMemoryScriptRegistrar } from './testing/in-memory-script-registrar';
import { createInMemoryStateRepo } from './testing/in-memory-state-repo';
import { createInMemoryTabs, type InMemoryTab } from './testing/in-memory-tabs';

const PROD = '*://prod.example.com/*';
const MARKER = ['content-scripts/content.js'];
const PICKER = ['content-scripts/picker.js'];
const prod = aSiteGroup({ patterns: [aWildcardPattern({ value: PROD })] });
const sender: ContentSender = {
  tabId: 4,
  url: 'https://prod.example.com/orders',
  origin: 'https://prod.example.com',
};

type Options = {
  state?: SiteMarkState;
  loaded?: LoadedState;
  granted?: string[];
  tabs?: InMemoryTab[];
};

function setup(options: Options = {}) {
  const loaded = options.loaded ?? {
    mode: 'normal',
    state: options.state ?? aState({ siteGroups: [prod] }),
  };
  const ports = {
    stateRepo: createInMemoryStateRepo({ loaded }),
    permissions: createInMemoryPermissions(options.granted ?? [PROD]),
    registrar: createInMemoryScriptRegistrar(),
    tabs: createInMemoryTabs(options.tabs ?? [{ id: 4, url: sender.url, injected: true }]),
    badge: createInMemoryBadge(),
    logger: createInMemoryLogger(),
    idGen: fixedIdGen(),
    markerFiles: MARKER,
    pickerFiles: PICKER,
    openOptions: vi.fn(async (route: string) => route.startsWith('/')),
    grantPageUrl: (origins: readonly string[]) => `grant.html?origins=${origins.join(',')}`,
  } satisfies BackgroundPorts;
  return { ports, app: createBackgroundApp(ports) };
}

describe('REQ-PRIV-003 every background start syncs the registration (D-231)', () => {
  it('registers the marker for granted origins of enabled groups on start', async () => {
    const { app, ports } = setup();
    await app.start();
    expect(ports.registrar.current).toEqual({ matches: [PROD] });
  });

  it('keeps nothing in memory: a new instance over the same storage behaves the same', async () => {
    const first = setup();
    await first.app.handlers.command({ type: 'createSiteGroup', name: 'Staging' });
    const second = createBackgroundApp(first.ports);
    const state = await second.handlers.getState(undefined);
    expect(state.siteGroups.map((group) => group.name)).toEqual([prod.name, 'Staging']);
  });

  it('marks every open tab "!" on start while the data is read-only (REQ-DATA-007)', async () => {
    const { app, ports } = setup({
      loaded: { mode: 'readOnly', state: emptyState(), schemaVersion: 2 },
      tabs: [{ id: 1 }, { id: 2 }],
    });
    await app.start();
    expect([ports.badge.textOf(1), ports.badge.textOf(2)]).toEqual(['!', '!']);
  });

  it('syncs after each saved change and pushes the new plans to the tabs (REQ-RND-007)', async () => {
    const { app, ports } = setup({ state: aState({ siteGroups: [{ ...prod, enabled: false }] }) });
    await app.handlers.command({ type: 'setSiteGroupEnabled', id: prod.id, enabled: true });
    expect(ports.registrar.current).toEqual({ matches: [PROD] });
    expect(ports.tabs.sent.map(({ message }) => (message as { type: string }).type)).toEqual([
      'applyPlan',
    ]);
  });

  it('follows grants from anywhere once it watches the permissions', async () => {
    const { app, ports } = setup({ granted: [] });
    app.watchPermissions();
    ports.permissions.grant(PROD);
    await expect.poll(() => ports.registrar.current).toEqual({ matches: [PROD] });
  });
});

describe('REQ-OPT-001 the welcome tab opens on install', () => {
  it('opens the options page at /welcome on a fresh install, and syncs', async () => {
    const { app, ports } = setup();
    await app.installed('install');
    expect(ports.openOptions).toHaveBeenCalledExactlyOnceWith('/welcome');
    expect(ports.registrar.current).toEqual({ matches: [PROD] });
  });

  it('opens nothing on an update', async () => {
    const { app, ports } = setup();
    await app.installed('update');
    expect(ports.openOptions).not.toHaveBeenCalled();
  });
});

describe('REQ-SEC-001 content intents act on the sender only', () => {
  it('answers renderPlanFor with the plan for the sender URL (REQ-SEC-002)', async () => {
    const mark = anElementMark();
    const { app } = setup({ state: aState({ siteGroups: [{ ...prod, marks: [mark] }] }) });
    const plan = await app.handlers.renderPlanFor(undefined, sender);
    expect(plan.items.map((item) => item.markIds)).toEqual([[mark.id]]);
    const other = { ...sender, url: 'https://other.example.org/' };
    expect((await app.handlers.renderPlanFor(undefined, other)).items).toEqual([]);
  });

  it('shows the status badge on the sender tab (REQ-POP-007)', async () => {
    const { app, ports } = setup();
    const status: TabStatus = {
      marks: [{ markId: 'mark00000009' as MarkId, found: false }],
      favicon: 'off',
      hidden: false,
    };
    await app.handlers.reportStatus(status, sender);
    expect(ports.badge.textOf(4)).toBe('!');
  });

  it('saves a pick to a group for the sender (REQ-PICK-005)', async () => {
    const { app, ports } = setup();
    const pick = { selector: '#total', effects: ['outline'] as const, color: '#1f6feb' as Hex };
    const result = await app.handlers.savePick({ ...pick, siteGroupId: prod.id }, sender);
    expect(result).toEqual({ ok: true, value: 'mark00000001' });
    const { state } = await ports.stateRepo.load();
    expect(state.siteGroups[0]?.marks).toHaveLength(1);
  });

  it('opens grant.html for the sender host (REQ-PICK-006, D-229)', async () => {
    const { app, ports } = setup();
    await app.handlers.requestGrant(undefined, {
      ...sender,
      origin: 'https://prod.example.com:8443',
    });
    expect(ports.tabs.created).toEqual([`grant.html?origins=${PROD}`]);
  });

  it('opens the options page at the route the panel asks for', async () => {
    const { app, ports } = setup();
    await app.handlers.openOptions({ route: '/settings' }, sender);
    expect(ports.openOptions).toHaveBeenCalledExactlyOnceWith('/settings');
  });
});

describe('REQ-PICK-001 REQ-CMD-001 REQ-CMD-002 page messages and commands reach their use cases', () => {
  it('starts the picker from the popup and from the shortcut', async () => {
    const { app, ports } = setup();
    expect(await app.handlers.startPicker({ tabId: 4 })).toEqual({ ok: true, value: undefined });
    await app.runCommand('start-picker', 4);
    expect(ports.tabs.injections).toEqual([
      { tabId: 4, files: PICKER },
      { tabId: 4, files: PICKER },
    ]);
  });

  it('answers getTabStatus with the marker status, or not-injected', async () => {
    const status: TabStatus = { marks: [], favicon: 'off', hidden: true };
    const { app, ports } = setup({ tabs: [{ id: 4, injected: true }, { id: 5 }] });
    ports.tabs.respondWith(4, () => status);
    expect(await app.handlers.getTabStatus({ tabId: 4 })).toEqual(status);
    expect(await app.handlers.getTabStatus({ tabId: 5 })).toBe('not-injected');
  });

  it('toggles hide from the popup and from the shortcut', async () => {
    const { app, ports } = setup({ tabs: [{ id: 4, injected: true }] });
    ports.tabs.respondWith(4, () => ({ marks: [], favicon: 'off', hidden: false }));
    await app.handlers.toggleHidden({ tabId: 4 });
    await app.runCommand('toggle-hide', 4);
    const hides = ports.tabs.sent.filter(
      ({ message }) => (message as { type: string }).type === 'setHidden',
    );
    expect(hides).toHaveLength(2);
  });

  it('marks this site and previews an import', async () => {
    const { app } = setup({ tabs: [{ id: 4 }] });
    const origin = { hostname: 'new.example.com', port: '' };
    expect((await app.handlers.markThisSite({ tabId: 4, origin })).ok).toBe(true);
    expect(await app.handlers.importPreview({ text: 'nope' })).toEqual({
      ok: false,
      error: { code: 'importInvalidJson' },
    });
    expect((await app.handlers.importApply({ text: 'nope', mode: 'merge' })).ok).toBe(false);
  });
});
