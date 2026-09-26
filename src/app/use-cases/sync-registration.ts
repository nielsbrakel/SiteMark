import { notImplemented } from '../../core/not-implemented';
import type { Logger, Permissions, ScriptRegistrar, StateRepo } from '../ports';

export type SyncRegistrationDeps = {
  readonly stateRepo: Pick<StateRepo, 'load'>;
  readonly permissions: Pick<Permissions, 'contains'>;
  readonly registrar: ScriptRegistrar;
  readonly logger: Logger;
};

/**
 * Brings the marker registration in line with the stored state and the live grants. Resolves once
 * it reflects everything that changed before the call; never rejects.
 */
export type SyncRegistration = () => Promise<void>;

export function createSyncRegistration(_deps: SyncRegistrationDeps): SyncRegistration {
  return notImplemented();
}
