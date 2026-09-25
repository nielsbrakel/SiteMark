import { describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { type StateRepoSeed, stateRepoContract } from '../../tests/contracts/state-repo-contract';
import corruptFixture from '../../tests/fixtures/state/corrupt.json';
import newerFixture from '../../tests/fixtures/state/newer.json';
import v1Fixture from '../../tests/fixtures/state/v1.json';
import { createInMemoryLogger } from '../app/testing/in-memory-logger';
import type { MigrationSteps } from '../core/data/migrate';
import { emptyState } from '../core/model/defaults';
import { aState } from '../core/testing/builders';
import { fixedClock } from '../core/testing/test-doubles';
import { createStateRepo, restrictStorageAccess } from './state-repo';

const STATE = 'sitemark:state';
const local = fakeBrowser.storage.local;

async function stored(key: string): Promise<unknown> {
  return (await local.get(key))[key];
}

function setup(steps?: MigrationSteps) {
  const clock = fixedClock();
  const logger = createInMemoryLogger();
  return { clock, logger, repo: createStateRepo({ clock, logger, ...(steps && { steps }) }) };
}

const seedData: Record<StateRepoSeed, unknown> = {
  fresh: undefined,
  unreadable: corruptFixture,
  newer: newerFixture,
};

describe('REQ-DATA-001 REQ-DATA-007 the storage.local StateRepo keeps the StateRepo contract', () => {
  stateRepoContract(async (seed) => {
    const raw = seedData[seed];
    if (raw !== undefined) await local.set({ [STATE]: structuredClone(raw) });
    return setup().repo;
  });
});

describe('REQ-DATA-001 stored state is validated when read', () => {
  it('loads a valid stored state and saves under sitemark:state', async () => {
    await local.set({ [STATE]: structuredClone(v1Fixture) });
    const { repo } = setup();
    const loaded = await repo.load();
    expect(loaded.mode).toBe('normal');
    expect(loaded.state).toEqual(v1Fixture);

    const next = aState({ revision: 43 });
    await repo.save(next);
    expect(await stored(STATE)).toEqual(next);
  });

  it('migrates older data and writes the migrated state back', async () => {
    await local.set({ [STATE]: { ...structuredClone(v1Fixture), schemaVersion: 0 } });
    const steps: MigrationSteps = { 0: (data) => ({ ...(data as object), schemaVersion: 1 }) };
    const { repo } = setup(steps);
    await expect(repo.load()).resolves.toEqual({ mode: 'normal', state: v1Fixture });
    expect(await stored(STATE)).toEqual(v1Fixture);
  });

  it('turns a failed write into storageFailed and logs it', async () => {
    const { repo, logger } = setup();
    vi.spyOn(local, 'set').mockRejectedValueOnce(new Error('QUOTA_BYTES quota exceeded'));
    await expect(repo.save(aState())).resolves.toEqual({ ok: false, error: 'storageFailed' });
    expect(logger.entries.map((entry) => entry.level)).toEqual(['error']);
    expect(await stored(STATE)).toBeUndefined();
  });
});

describe('REQ-DATA-001 unreadable data goes into one of 3 rotating backups', () => {
  it('backs the raw data up with the time and leaves it in place until the next save', async () => {
    await local.set({ [STATE]: structuredClone(corruptFixture) });
    const { repo, clock } = setup();
    const loaded = await repo.load();
    const backup = { slot: 0, savedAt: clock.now(), raw: corruptFixture };
    expect(loaded).toEqual({ mode: 'recovered', state: emptyState(), backup });
    expect(await stored('sitemark:backup:0')).toEqual({
      savedAt: clock.now(),
      raw: corruptFixture,
    });
    expect(await stored(STATE)).toEqual(corruptFixture);
  });

  it('reuses the backup when it loads the same unreadable data again', async () => {
    await local.set({ [STATE]: 'not a state' });
    const { repo, clock } = setup();
    const first = await repo.load();
    clock.advance(60_000);
    await expect(repo.load()).resolves.toEqual(first);
    await expect(repo.backups()).resolves.toHaveLength(1);
  });

  it('fills the empty slots first, then replaces the oldest backup', async () => {
    const { repo, clock } = setup();
    for (const raw of ['one', 'two', 'three', 'four']) {
      await local.set({ [STATE]: raw });
      await repo.load();
      clock.advance(1000);
    }
    const start = clock.now() - 4000;
    await expect(repo.backups()).resolves.toEqual([
      { slot: 0, savedAt: start + 3000, raw: 'four' },
      { slot: 2, savedAt: start + 2000, raw: 'three' },
      { slot: 1, savedAt: start + 1000, raw: 'two' },
    ]);
  });

  it('ignores a malformed backup entry and reuses its slot', async () => {
    await local.set({ 'sitemark:backup:0': 'garbage', [STATE]: [] });
    const { repo } = setup();
    const loaded = await repo.load();
    expect(loaded.mode === 'recovered' && loaded.backup.slot).toBe(0);
    await expect(repo.backups()).resolves.toHaveLength(1);
  });
});

describe('REQ-DATA-007 data from a newer version is never destroyed', () => {
  it('keeps the raw data untouched and makes no backup', async () => {
    await local.set({ [STATE]: structuredClone(newerFixture) });
    const { repo } = setup();
    await repo.load();
    await repo.save(emptyState());
    expect(await stored(STATE)).toEqual(newerFixture);
    await expect(repo.backups()).resolves.toEqual([]);
  });
});

describe('REQ-PRIV-006 data is stored only in storage.local', () => {
  it('never touches storage.sync', async () => {
    // Destructured, because the lint plugin bans every `storage.sync` member access.
    const { sync } = fakeBrowser.storage;
    const syncSet = vi.spyOn(sync, 'set');
    const syncGet = vi.spyOn(sync, 'get');
    await local.set({ [STATE]: 'unreadable' });
    const { repo } = setup();
    await repo.load();
    await repo.save(aState());
    await repo.load();
    await repo.backups();
    expect(syncSet).not.toHaveBeenCalled();
    expect(syncGet).not.toHaveBeenCalled();
    expect(Object.keys(await local.get(null)).sort()).toEqual([
      'sitemark:backup:0',
      'sitemark:state',
    ]);
  });
});

describe('REQ-SEC-002 storage.local is restricted to trusted contexts where the browser can', () => {
  it('sets the TRUSTED_CONTEXTS access level on storage.local', async () => {
    const setAccessLevel = vi.spyOn(local, 'setAccessLevel').mockResolvedValue(undefined);
    const logger = createInMemoryLogger();
    await expect(restrictStorageAccess(logger)).resolves.toBe(true);
    expect(setAccessLevel).toHaveBeenCalledExactlyOnceWith({ accessLevel: 'TRUSTED_CONTEXTS' });
    expect(logger.entries).toEqual([]);
  });

  it('skips browsers without the API (Firefox, Safari) quietly', async () => {
    const logger = createInMemoryLogger();
    await expect(restrictStorageAccess(logger, {})).resolves.toBe(false);
    expect(logger.entries).toEqual([]);
  });

  it('logs a warning instead of failing when the browser refuses', async () => {
    const logger = createInMemoryLogger();
    const refused = new Error('Access level not supported');
    const area = { setAccessLevel: vi.fn().mockRejectedValue(refused) };
    await expect(restrictStorageAccess(logger, area)).resolves.toBe(false);
    expect(logger.entries).toEqual([
      { level: 'warn', message: expect.stringContaining('access level'), detail: refused },
    ]);
  });
});
