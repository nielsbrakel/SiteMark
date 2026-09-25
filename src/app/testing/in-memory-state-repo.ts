import type { SiteMarkState } from '../../core/model/schema';
import { notImplemented } from '../../core/not-implemented';
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

/** A StateRepo fake for use-case tests, keeping tests/contracts/state-repo-contract.ts. */
export function createInMemoryStateRepo(
  _options: InMemoryStateRepoOptions = {},
): InMemoryStateRepo {
  return notImplemented();
}
