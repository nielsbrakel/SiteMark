import type { Logger, StateRepo } from '../app/ports';
import type { MigrationSteps } from '../core/data/migrate';
import type { Clock } from '../core/ids';
import { notImplemented } from '../core/not-implemented';

export type StateRepoDeps = {
  readonly clock: Clock;
  readonly logger: Logger;
  /** Tests inject steps; production uses the registry in src/core/data/migrate.ts. */
  readonly steps?: MigrationSteps;
};

/**
 * The StateRepo adapter over `storage.local` (never `storage.sync`, REQ-PRIV-006). The state lives
 * under `sitemark:state`, unreadable data in the rotating backups `sitemark:backup:0…2`.
 */
export function createStateRepo(_deps: StateRepoDeps): StateRepo {
  return notImplemented();
}
