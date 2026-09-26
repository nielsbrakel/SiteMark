import { describe, expect, it } from 'vitest';
import { backgroundHarness, MARKER_FILES } from '../../../tests/support/background-harness';
import { emptyState } from '../../core/model/defaults';
import { presetColor } from '../../core/model/presets';
import { err } from '../../core/result';
import { aSiteGroup, aState } from '../../core/testing/builders';
import type { InMemoryTab } from '../testing/in-memory-tabs';
import { watchPermissions } from './grant';
import { markThisSite } from './mark-this-site';

const ORIGIN = '*://staging.example.com/*';
const request = { tabId: 7, origin: { hostname: 'staging.example.com', port: '8080' } };
const tab: InMemoryTab = { id: 7, url: 'http://staging.example.com:8080/orders', active: true };

function setup(options: Parameters<typeof backgroundHarness>[0] = {}) {
  const harness = backgroundHarness({ tabs: [tab], ...options });
  const deps = { ...harness.grant, queue: harness.queue };
  return { ...harness, deps };
}

describe('REQ-POP-006 "Mark this site" adds the default site group (D-201)', () => {
  it('adds a group for the host at the bottom, with one blue ribbon showing the host', async () => {
    const { deps, stored } = setup({ state: aState({ siteGroups: [aSiteGroup()] }) });
    const result = await markThisSite(deps, request);
    expect(result).toEqual({ ok: true, value: { revision: 1, notices: [] } });
    const group = (await stored()).siteGroups.at(-1);
    expect(group).toMatchObject({
      name: 'staging.example.com',
      enabled: true,
      patterns: [{ kind: 'wildcard', value: '*://staging.example.com:8080/*' }],
      marks: [
        {
          target: { kind: 'page' },
          color: presetColor('blue'),
          effects: { ribbon: { text: 'staging.example.' } },
        },
      ],
    });
  });

  it('refuses a host the pattern can not name, and changes nothing', async () => {
    const { deps, repo, tabs } = setup();
    const bad = { tabId: 7, origin: { hostname: '*.example.com', port: '' } };
    expect((await markThisSite(deps, bad)).ok).toBe(false);
    expect(repo.saves).toEqual([]);
    expect(tabs.injections).toEqual([]);
  });

  it('refuses while the data is read-only (REQ-DATA-007)', async () => {
    const { deps, tabs } = setup({
      loaded: { mode: 'readOnly', state: emptyState(), schemaVersion: 9 },
    });
    expect(await markThisSite(deps, request)).toEqual(err('stateReadOnly'));
    expect(tabs.injections).toEqual([]);
  });
});

describe('REQ-POP-006 the ribbon shows on the tab right away, granted or not (D-229)', () => {
  it('shows it through activeTab when the origin is not granted, without registering', async () => {
    const { deps, tabs, registrar } = setup();
    await markThisSite(deps, request);
    expect(tabs.injections).toEqual([{ tabId: 7, files: [...MARKER_FILES] }]);
    expect(registrar.current).toBeUndefined();
  });

  it('registers the marker when the origin is granted, and injects into each tab once', async () => {
    const other: InMemoryTab = { id: 8, url: 'https://staging.example.com/' };
    const { deps, tabs, registrar } = setup({ tabs: [tab, other], granted: [ORIGIN] });
    await markThisSite(deps, request);
    expect(registrar.current).toEqual({ matches: [ORIGIN] });
    expect(tabs.injections.map(({ tabId }) => tabId).sort()).toEqual([7, 8]);
  });

  it('completes the grant when the user allows after the group was added', async () => {
    const { deps, tabs, registrar, permissions, grant } = setup();
    watchPermissions(permissions, grant);
    await markThisSite(deps, request);
    permissions.grant(ORIGIN);
    await expect.poll(() => registrar.current).toEqual({ matches: [ORIGIN] });
    expect(tabs.injections.length).toBeGreaterThanOrEqual(1);
  });

  it('still adds the group on a page where scripts can not run', async () => {
    const { deps, stored } = setup({ tabs: [{ ...tab, restricted: true }] });
    expect((await markThisSite(deps, request)).ok).toBe(true);
    expect((await stored()).siteGroups).toHaveLength(1);
  });
});
