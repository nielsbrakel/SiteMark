import { describe, expect, it, vi } from 'vitest';
import type { Command } from '../core/commands/command';
import { emptyState } from '../core/model/defaults';
import type { SiteMarkState } from '../core/model/schema';
import { err, ok } from '../core/result';
import { aSiteGroup, aState } from '../core/testing/builders';
import { MISSING_GROUP_ID } from '../core/testing/reducers';
import { fixedIdGen } from '../core/testing/test-doubles';
import { type CommandQueueDeps, createCommandQueue } from './command-queue';
import type { StateRepo } from './ports';
import { createInMemoryLogger } from './testing/in-memory-logger';
import { createInMemoryStateRepo, type InMemoryStateRepo } from './testing/in-memory-state-repo';

const create = (name: string): Command => ({ type: 'createSiteGroup', name });

function setup(overrides: Partial<CommandQueueDeps> = {}, state = emptyState()) {
  const repo = createInMemoryStateRepo({ loaded: { mode: 'normal', state } });
  const logger = createInMemoryLogger();
  const committed: SiteMarkState[] = [];
  const queue = createCommandQueue({
    repo,
    idGen: fixedIdGen(),
    logger,
    onCommitted: (saved) => void committed.push(saved),
    ...overrides,
  });
  return { repo, logger, committed, queue };
}

async function stored(repo: StateRepo): Promise<SiteMarkState> {
  return (await repo.load()).state;
}

/** Like the real storage: every call takes a different number of turns to settle. */
function slow(repo: InMemoryStateRepo): StateRepo {
  let calls = 0;
  const pause = async () => {
    calls += 1;
    for (let turn = 0; turn < (calls * 7) % 5; turn += 1) await Promise.resolve();
  };
  return {
    load: async () => {
      await pause();
      return repo.load();
    },
    save: async (state) => {
      await pause();
      return repo.save(state);
    },
    backups: () => repo.backups(),
  };
}

describe('REQ-SEC-001 the command queue is the single, serialized writer (D-220)', () => {
  it('applies a command to the fresh stored state and saves it with the next revision', async () => {
    const { repo, queue } = setup({}, aState({ revision: 4, siteGroups: [] }));
    await expect(queue.dispatch(create('Production'))).resolves.toEqual(
      ok({ revision: 5, notices: [] }),
    );
    const saved = await stored(repo);
    expect(saved.revision).toBe(5);
    expect(saved.siteGroups.map((group) => group.name)).toEqual(['Production']);
  });

  it('returns the notices of the command', async () => {
    const group = aSiteGroup();
    const [pattern] = group.patterns;
    const { queue } = setup({}, aState({ siteGroups: [group] }));
    const removed = await queue.dispatch({
      type: 'removePattern',
      groupId: group.id,
      patternId: pattern?.id ?? expect.fail('no pattern'),
    });
    expect(removed).toEqual(ok({ revision: 1, notices: ['siteGroupAutoDisabled'] }));
  });

  it('applies concurrent commands one after the other, so no update is lost', async () => {
    const repo = createInMemoryStateRepo();
    const queue = createCommandQueue({
      repo: slow(repo),
      idGen: fixedIdGen(),
      logger: createInMemoryLogger(),
    });
    const names = Array.from({ length: 25 }, (_, index) => `Group ${index + 1}`);
    const results = await Promise.all(names.map((name) => queue.dispatch(create(name))));
    expect(results).toEqual(names.map((_, index) => ok({ revision: index + 1, notices: [] })));
    expect(repo.saves.map((state) => state.revision)).toEqual(names.map((_, index) => index + 1));
    expect((await stored(repo)).siteGroups.map((group) => group.name)).toEqual(names);
  });

  it('passes a refusal through without saving or bumping the revision', async () => {
    const { repo, committed, queue } = setup();
    const refused = await queue.dispatch({
      type: 'renameSiteGroup',
      id: MISSING_GROUP_ID,
      name: 'X',
    });
    expect(refused).toEqual(err('siteGroupNotFound'));
    await expect(queue.dispatch(create('Next'))).resolves.toEqual(ok({ revision: 1, notices: [] }));
    expect(repo.saves).toHaveLength(1);
    expect(committed).toHaveLength(1);
  });

  it('refuses every change while the data is read-only (REQ-DATA-007)', async () => {
    const repo = createInMemoryStateRepo({
      loaded: { mode: 'readOnly', state: emptyState(), schemaVersion: 2 },
    });
    const onCommitted = vi.fn();
    const queue = createCommandQueue({
      repo,
      idGen: fixedIdGen(),
      logger: createInMemoryLogger(),
      onCommitted,
    });
    await expect(queue.dispatch(create('X'))).resolves.toEqual(err('stateReadOnly'));
    await expect(queue.run((state) => ok(state))).resolves.toEqual(err('stateReadOnly'));
    expect(repo.saves).toEqual([]);
    expect(onCommitted).not.toHaveBeenCalled();
  });

  it('reports a failed save and keeps going', async () => {
    const { repo, committed, queue } = setup();
    repo.failNextSave();
    await expect(queue.dispatch(create('Lost'))).resolves.toEqual(err('storageFailed'));
    expect(committed).toEqual([]);
    await expect(queue.dispatch(create('Kept'))).resolves.toEqual(ok({ revision: 1, notices: [] }));
  });

  it('keeps going when reading the state throws', async () => {
    const repo = createInMemoryStateRepo();
    const load = vi.spyOn(repo, 'load').mockRejectedValueOnce(new Error('storage gone'));
    const queue = createCommandQueue({ repo, idGen: fixedIdGen(), logger: createInMemoryLogger() });
    const failed = queue.dispatch(create('A'));
    const next = queue.dispatch(create('B'));
    await expect(failed).rejects.toThrow('storage gone');
    await expect(next).resolves.toEqual(ok({ revision: 1, notices: [] }));
    expect(load).toHaveBeenCalledTimes(2);
  });
});

describe('REQ-SEC-001 REQ-RND-007 the command queue reports each commit', () => {
  it('calls onCommitted with each saved state, in order, before the dispatch resolves', async () => {
    const { repo, committed, queue } = setup();
    await queue.dispatch(create('A'));
    expect(committed).toEqual(repo.saves);
    await Promise.all([queue.dispatch(create('B')), queue.dispatch(create('C'))]);
    expect(committed.map((state) => state.revision)).toEqual([1, 2, 3]);
    expect(committed).toEqual(repo.saves);
  });

  it('logs a failing onCommitted hook without failing the command or the queue', async () => {
    const hookError = new Error('push failed');
    const onCommitted = vi.fn().mockRejectedValueOnce(hookError);
    const { logger, queue } = setup({ onCommitted });
    await expect(queue.dispatch(create('A'))).resolves.toEqual(ok({ revision: 1, notices: [] }));
    await expect(queue.dispatch(create('B'))).resolves.toEqual(ok({ revision: 2, notices: [] }));
    expect(onCommitted).toHaveBeenCalledTimes(2);
    expect(logger.entries).toEqual([
      { level: 'error', message: expect.any(String), detail: hookError },
    ]);
  });
});

describe('REQ-SEC-001 the command queue runs other transformations too (imports, T-073)', () => {
  it('saves the transformed state with the next revision', async () => {
    const { repo, committed, queue } = setup({}, aState({ revision: 2 }));
    const rename = vi.fn((state: SiteMarkState) =>
      ok({ ...state, settings: { theme: 'dark' as const } }),
    );
    await expect(queue.run(rename)).resolves.toEqual(ok({ revision: 3, notices: [] }));
    expect(rename.mock.calls.map(([state]) => state.revision)).toEqual([2]);
    expect(await stored(repo)).toMatchObject({ revision: 3, settings: { theme: 'dark' } });
    expect(committed).toHaveLength(1);
  });

  it('passes the transformation error through', async () => {
    const { repo, queue } = setup();
    await expect(queue.run(() => err('siteGroupLimitReached'))).resolves.toEqual(
      err('siteGroupLimitReached'),
    );
    expect(repo.saves).toEqual([]);
  });

  it('refuses a transformed state that fails the schema', async () => {
    const { repo, queue } = setup();
    const group = aSiteGroup();
    // Duplicate IDs: a bug the schema catches, so nothing is saved.
    const broken = (state: SiteMarkState) => ok({ ...state, siteGroups: [group, group] });
    await expect(queue.run(broken)).resolves.toEqual(err('commandProducedInvalidState'));
    expect(repo.saves).toEqual([]);
  });

  it('serializes transformations with commands', async () => {
    const { repo, queue } = setup();
    const results = await Promise.all([
      queue.dispatch(create('A')),
      queue.run((state) => ok({ ...state, settings: { theme: 'light' as const } })),
      queue.dispatch(create('B')),
    ]);
    expect(results.map((result) => result.ok && result.value.revision)).toEqual([1, 2, 3]);
    expect(await stored(repo)).toMatchObject({ revision: 3, settings: { theme: 'light' } });
    expect((await stored(repo)).siteGroups.map((group) => group.name)).toEqual(['A', 'B']);
  });
});
