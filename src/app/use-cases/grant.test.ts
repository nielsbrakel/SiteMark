import { describe, expect, it, vi } from 'vitest';
import { aSiteGroup, aState, aWildcardPattern } from '../../core/testing/builders';
import { createInMemoryLogger } from '../testing/in-memory-logger';
import { createInMemoryPermissions } from '../testing/in-memory-permissions';
import { createInMemoryScriptRegistrar } from '../testing/in-memory-script-registrar';
import { createInMemoryStateRepo } from '../testing/in-memory-state-repo';
import { createInMemoryTabs, type InMemoryTab } from '../testing/in-memory-tabs';
import { completeGrant, type GrantDeps, watchPermissions } from './grant';
import { createSyncRegistration } from './sync-registration';

const PROD = 'https://prod.example.com/*';
const TEST = '*://test.example.com/*';
const ANY_SUBDOMAIN = '*://*.example.org/*';
const FILES = ['content-scripts/content.js'];

const groupFor = (value: string) => aSiteGroup({ patterns: [aWildcardPattern({ value })] });

function setup(patterns: readonly string[], tabs: readonly InMemoryTab[], granted: string[] = []) {
  const state = aState({ siteGroups: patterns.map(groupFor) });
  const stateRepo = createInMemoryStateRepo({ loaded: { mode: 'normal', state } });
  const permissions = createInMemoryPermissions(granted);
  const registrar = createInMemoryScriptRegistrar();
  const logger = createInMemoryLogger();
  const syncRegistration = createSyncRegistration({ stateRepo, permissions, registrar, logger });
  const inMemoryTabs = createInMemoryTabs(tabs);
  const deps: GrantDeps = { syncRegistration, registrar, tabs: inMemoryTabs, markerFiles: FILES };
  /** The user allows in a prompt: the browser grants, then the background hears of it. */
  const grant = async (...origins: string[]) => {
    permissions.grant(...origins);
    await completeGrant(deps, origins);
  };
  return { deps, grant, permissions, registrar, tabs: inMemoryTabs };
}

const injectedTabs = (tabs: ReturnType<typeof setup>['tabs']) =>
  tabs.injections.map(({ tabId }) => tabId);

describe('REQ-PRIV-002 a grant completes in the background (D-229)', () => {
  it('registers the marker for the new origin and injects it into its open tabs', async () => {
    const { grant, registrar, tabs } = setup(
      [PROD, TEST],
      [
        { id: 1, url: 'https://prod.example.com/orders?id=7' },
        { id: 2, url: 'https://elsewhere.example.net/' },
        { id: 3 },
        { id: 4, url: 'https://test.example.com/' },
      ],
    );
    await grant(PROD);
    expect(registrar.current).toEqual({ matches: [PROD] });
    expect(tabs.injections).toEqual([{ tabId: 1, files: FILES }]);
  });

  it('covers every subdomain of a wildcard origin', async () => {
    const { grant, tabs } = setup(
      [ANY_SUBDOMAIN],
      [
        { id: 1, url: 'http://eu.example.org/' },
        { id: 2, url: 'https://example.org/' },
        { id: 3, url: 'https://example.org.evil.test/' },
      ],
    );
    await grant(ANY_SUBDOMAIN);
    expect(injectedTabs(tabs)).toEqual([1, 2]);
  });

  it('leaves tabs on origins granted before alone: their marker is already there', async () => {
    const { grant, tabs } = setup(
      [PROD, TEST],
      [
        { id: 1, url: 'https://prod.example.com/' },
        { id: 2, url: 'https://test.example.com/' },
      ],
      [TEST],
    );
    await grant(PROD);
    expect(injectedTabs(tabs)).toEqual([1]);
  });

  it('injects nothing for an origin no enabled site group uses', async () => {
    const { grant, registrar, tabs } = setup([TEST], [{ id: 1, url: 'https://prod.example.com/' }]);
    await grant(PROD);
    expect(registrar.current).toBeUndefined();
    expect(tabs.injections).toEqual([]);
  });

  it('ignores grants that are not origins', async () => {
    const { deps, tabs } = setup([PROD], [{ id: 1, url: 'https://prod.example.com/' }], [PROD]);
    await completeGrant(deps, ['<all_urls>']);
    expect(tabs.injections).toEqual([]);
  });

  it('keeps going when a tab refuses the injection', async () => {
    const { grant, tabs } = setup(
      [PROD],
      [
        { id: 1, url: 'https://prod.example.com/a', restricted: true },
        { id: 2, url: 'https://prod.example.com/b' },
      ],
    );
    await grant(PROD);
    expect(injectedTabs(tabs)).toEqual([2]);
  });
});

describe('REQ-PRIV-003 grants and revocations from anywhere re-sync the registration', () => {
  it('completes a grant from the browser UI and unregisters after a revocation', async () => {
    const { deps, permissions, registrar, tabs } = setup(
      [PROD],
      [{ id: 1, url: 'https://prod.example.com/' }],
    );
    watchPermissions(permissions, deps);
    permissions.grant(PROD);
    await vi.waitFor(() => expect(injectedTabs(tabs)).toEqual([1]));
    expect(registrar.current).toEqual({ matches: [PROD] });
    permissions.revoke(PROD);
    await vi.waitFor(() => expect(registrar.current).toBeUndefined());
  });

  it('stops listening once unsubscribed', async () => {
    const { deps, permissions } = setup([PROD], []);
    const sync = vi.fn(deps.syncRegistration);
    const unsubscribe = watchPermissions(permissions, { ...deps, syncRegistration: sync });
    unsubscribe();
    permissions.grant(PROD);
    permissions.revoke(PROD);
    await Promise.resolve();
    expect(sync).not.toHaveBeenCalled();
  });
});
