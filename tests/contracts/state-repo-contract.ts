import { expect, it } from 'vitest';
import type { StateRepo } from '../../src/app/ports';
import { emptyState } from '../../src/core/model/defaults';
import { aSiteGroup, aState } from '../../src/core/testing/builders';
import corruptFixture from '../fixtures/state/corrupt.json';

/**
 * What the stored data looks like before the repo is created:
 * - `fresh`: nothing stored (a new install)
 * - `unreadable`: tests/fixtures/state/corrupt.json
 * - `newer`: tests/fixtures/state/newer.json (schema version 2)
 */
export type StateRepoSeed = 'fresh' | 'unreadable' | 'newer';

/** The StateRepo port's contract (REQ-NFR-004): the in-memory fake and the adapter both keep it. */
export function stateRepoContract(setup: (seed: StateRepoSeed) => Promise<StateRepo>): void {
  it('starts a fresh install with an empty, writable state', async () => {
    const repo = await setup('fresh');
    await expect(repo.load()).resolves.toEqual({ mode: 'normal', state: emptyState() });
    await expect(repo.backups()).resolves.toEqual([]);
  });

  it('loads the state it saved', async () => {
    const repo = await setup('fresh');
    const state = aState({ revision: 3, siteGroups: [aSiteGroup({ name: 'Staging' })] });
    await expect(repo.save(state)).resolves.toEqual({ ok: true, value: undefined });
    await expect(repo.load()).resolves.toEqual({ mode: 'normal', state });
  });

  it('keeps its own copy, so later changes to the saved object do not leak in', async () => {
    const repo = await setup('fresh');
    const state = aState({ revision: 1 });
    await repo.save(state);
    state.revision = 99;
    const loaded = await repo.load();
    expect(loaded.state.revision).toBe(1);
    loaded.state.revision = 50;
    expect((await repo.load()).state.revision).toBe(1);
  });

  it('recovers unreadable data: defaults, the raw data in a backup, writable again', async () => {
    const repo = await setup('unreadable');
    const loaded = await repo.load();
    expect(loaded).toMatchObject({ mode: 'recovered', state: emptyState() });
    const backups = await repo.backups();
    expect(backups).toHaveLength(1);
    expect(backups[0]?.raw).toEqual(corruptFixture);
    expect(loaded.mode === 'recovered' && loaded.backup).toEqual(backups[0]);

    const state = aState({ revision: 1 });
    await expect(repo.save(state)).resolves.toEqual({ ok: true, value: undefined });
    await expect(repo.load()).resolves.toEqual({ mode: 'normal', state });
    await expect(repo.backups()).resolves.toEqual(backups);
  });

  it('opens newer data read-only and refuses every save', async () => {
    const repo = await setup('newer');
    const expected = { mode: 'readOnly', state: emptyState(), schemaVersion: 2 };
    await expect(repo.load()).resolves.toEqual(expected);
    await expect(repo.save(aState())).resolves.toEqual({ ok: false, error: 'stateReadOnly' });
    await expect(repo.load()).resolves.toEqual(expected);
  });
}
