import { describe, expect, it, vi } from 'vitest';
import { emptyState } from '../../core/model/defaults';
import type { SiteMarkState } from '../../core/model/schema';
import { err } from '../../core/result';
import { aRegexPattern, aSiteGroup, aState, aWildcardPattern } from '../../core/testing/builders';
import type { OriginPattern } from '../../core/url/origin';
import type { LoadedState, MarkerRegistration } from '../ports';
import { createInMemoryLogger } from '../testing/in-memory-logger';
import { createInMemoryPermissions } from '../testing/in-memory-permissions';
import { createInMemoryScriptRegistrar } from '../testing/in-memory-script-registrar';
import { createSyncRegistration } from './sync-registration';

const PROD = 'https://prod.example.com/*';
const TEST = '*://test.example.com/*';
const ADMIN = 'https://admin.example.com/*';

const groupFor = (value: string, enabled = true) =>
  aSiteGroup({ enabled, patterns: [aWildcardPattern({ value })] });

const normal = (state: SiteMarkState): LoadedState => ({ mode: 'normal', state });

type Setup = {
  loads?: readonly LoadedState[];
  granted?: readonly string[];
  registered?: MarkerRegistration;
};

/** `loads`: what each load() returns in turn (the last one repeats). */
function setup({ loads = [normal(emptyState())], granted = [], registered }: Setup = {}) {
  const queue = [...loads];
  const next = () => (queue.length > 1 ? queue.shift() : queue[0]) ?? normal(emptyState());
  const load = vi.fn(async () => structuredClone(next()));
  const permissions = createInMemoryPermissions(granted);
  const registrar = createInMemoryScriptRegistrar(registered);
  const logger = createInMemoryLogger();
  const sync = createSyncRegistration({ stateRepo: { load }, permissions, registrar, logger });
  return { sync, load, permissions, registrar, logger };
}

describe('REQ-PRIV-003 the marker is registered only for granted origins of enabled site groups', () => {
  it('registers the granted origins that enabled site groups use, sorted', async () => {
    const regex = aRegexPattern({ origins: [ADMIN as OriginPattern] });
    const state = aState({
      siteGroups: [
        groupFor(TEST),
        aSiteGroup({ patterns: [aWildcardPattern({ value: PROD }), regex] }),
        groupFor('https://gone.example.com/*'),
      ],
    });
    const { sync, registrar } = setup({ loads: [normal(state)], granted: [PROD, TEST, ADMIN] });
    await sync();
    expect(registrar.current).toEqual({ matches: [TEST, ADMIN, PROD] });
  });

  it('leaves out disabled site groups and origins that are not granted', async () => {
    const state = aState({ siteGroups: [groupFor(PROD, false), groupFor(TEST)] });
    const { sync, registrar } = setup({ loads: [normal(state)], granted: [PROD] });
    await sync();
    expect(registrar.current).toBeUndefined();
  });

  it('updates the registration when the desired origins change', async () => {
    const state = aState({ siteGroups: [groupFor(PROD), groupFor(TEST)] });
    const { sync, registrar } = setup({
      loads: [normal(state)],
      granted: [PROD, TEST],
      registered: { matches: [PROD] },
    });
    await sync();
    expect(registrar.current).toEqual({ matches: [TEST, PROD] });
  });

  it('unregisters the marker when no origin is left', async () => {
    const state = aState({ siteGroups: [groupFor(PROD)] });
    const { sync, registrar } = setup({ loads: [normal(state)], registered: { matches: [PROD] } });
    await sync();
    expect(registrar.current).toBeUndefined();
  });

  it('treats a registration from an earlier session as a cache and corrects it on start (D-231)', async () => {
    const { sync, registrar, permissions } = setup({
      loads: [normal(aState({ siteGroups: [groupFor(PROD)] }))],
      granted: [PROD],
      registered: { matches: [TEST] },
    });
    await sync();
    expect(registrar.current).toEqual({ matches: [PROD] });
    permissions.revoke(PROD);
    await createSyncRegistration({
      stateRepo: { load: async () => normal(aState({ siteGroups: [groupFor(PROD)] })) },
      permissions,
      registrar,
      logger: createInMemoryLogger(),
    })();
    expect(registrar.current).toBeUndefined();
  });

  it('is idempotent: an unchanged registration is left alone, whatever its order', async () => {
    const state = aState({ siteGroups: [groupFor(PROD), groupFor(TEST)] });
    const { sync, registrar } = setup({
      loads: [normal(state)],
      granted: [PROD, TEST],
      registered: { matches: [PROD, TEST] },
    });
    const calls = [
      vi.spyOn(registrar, 'register'),
      vi.spyOn(registrar, 'update'),
      vi.spyOn(registrar, 'unregister'),
    ];
    await sync();
    await sync();
    for (const call of calls) expect(call).not.toHaveBeenCalled();
    expect(registrar.current).toEqual({ matches: [PROD, TEST] });
  });

  it('does nothing without origins and without a registration', async () => {
    const { sync, registrar } = setup();
    const register = vi.spyOn(registrar, 'register');
    const unregister = vi.spyOn(registrar, 'unregister');
    await sync();
    expect(register).not.toHaveBeenCalled();
    expect(unregister).not.toHaveBeenCalled();
  });

  it('leaves the registration alone while the data is read-only (REQ-DATA-007)', async () => {
    const readOnly: LoadedState = { mode: 'readOnly', state: emptyState(), schemaVersion: 2 };
    const { sync, registrar } = setup({ loads: [readOnly], registered: { matches: [PROD] } });
    await sync();
    expect(registrar.current).toEqual({ matches: [PROD] });
  });
});

describe('REQ-PRIV-003 registration syncs one at a time (single-flight + dirty rerun)', () => {
  it('runs once more after the current sync when called while it runs', async () => {
    const before = aState({ siteGroups: [groupFor(PROD)] });
    const after = aState({ siteGroups: [groupFor(PROD), groupFor(TEST)] });
    const { sync, load, registrar } = setup({
      loads: [normal(before), normal(after)],
      granted: [PROD, TEST],
    });
    const first = sync();
    const second = sync();
    const third = sync();
    await second;
    expect(registrar.current).toEqual({ matches: [TEST, PROD] });
    await Promise.all([first, third]);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('starts a fresh sync once the previous one has finished', async () => {
    const { sync, load } = setup();
    await sync();
    await sync();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('retries a failed registration on the next sync', async () => {
    const { sync, registrar } = setup({
      loads: [normal(aState({ siteGroups: [groupFor(PROD)] }))],
      granted: [PROD],
    });
    vi.spyOn(registrar, 'register').mockResolvedValueOnce(err('registrationFailed'));
    await sync();
    expect(registrar.current).toBeUndefined();
    await sync();
    expect(registrar.current).toEqual({ matches: [PROD] });
  });

  it('never rejects: a failing load is logged and the next sync still runs', async () => {
    const { sync, load, logger, registrar } = setup({
      loads: [normal(aState({ siteGroups: [groupFor(PROD)] }))],
      granted: [PROD],
    });
    const broken = new Error('storage unavailable');
    load.mockRejectedValueOnce(broken);
    await expect(sync()).resolves.toBeUndefined();
    expect(logger.entries).toEqual([
      { level: 'error', message: 'Could not sync the marker registration', detail: broken },
    ]);
    await sync();
    expect(registrar.current).toEqual({ matches: [PROD] });
  });
});
