import { emptyState } from '../../core/model/defaults';
import type { SiteMarkState } from '../../core/model/schema';
import { err, ok } from '../../core/result';
import type { LoadedState, StateBackup, StateRepo } from '../ports';

export type InMemoryStateRepoOptions = {
  /** What `load()` finds until the first save. Default: a fresh install (`normal`, `emptyState()`). */
  readonly loaded?: LoadedState;
  /** Default: the backup of a `recovered` load, otherwise none. */
  readonly backups?: readonly StateBackup[];
};

export type InMemoryStateRepo = StateRepo & {
  /** Every state `save()` accepted, in order. */
  readonly saves: readonly SiteMarkState[];
  /** The next `save()` fails with `storageFailed`, like a full quota. */
  failNextSave(): void;
};

function defaultBackups(loaded: LoadedState): StateBackup[] {
  return loaded.mode === 'recovered' ? [loaded.backup] : [];
}

/** A StateRepo fake for use-case tests, keeping tests/contracts/state-repo-contract.ts. */
export function createInMemoryStateRepo(options: InMemoryStateRepoOptions = {}): InMemoryStateRepo {
  const fresh: LoadedState = { mode: 'normal', state: emptyState() };
  let current: LoadedState = structuredClone(options.loaded ?? fresh);
  const backups: StateBackup[] = structuredClone([...(options.backups ?? defaultBackups(current))]);
  const saves: SiteMarkState[] = [];
  let failNext = false;
  return {
    load: async (): Promise<LoadedState> => structuredClone(current),
    save: async (state) => {
      if (current.mode === 'readOnly') return err('stateReadOnly');
      if (failNext) {
        failNext = false;
        return err('storageFailed');
      }
      current = { mode: 'normal', state: structuredClone(state) };
      saves.push(structuredClone(state));
      return ok(undefined);
    },
    backups: async () => structuredClone(backups).sort((a, b) => b.savedAt - a.savedAt),
    saves,
    failNextSave: () => {
      failNext = true;
    },
  };
}
