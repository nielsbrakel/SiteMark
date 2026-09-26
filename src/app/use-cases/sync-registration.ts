import { originsOfEnabledSiteGroups } from '../../core/data/origins';
import type { SiteMarkState } from '../../core/model/schema';
import type { Logger, MarkerRegistration, Permissions, ScriptRegistrar, StateRepo } from '../ports';

// REQ-PRIV-003, D-231, plan §3.2: desired = granted origins ∩ origins of enabled site groups,
// diffed against what the browser has registered. The browser's registration is only a cache
// (Safari may drop or keep it), so every background start syncs again.

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

/** The origins of enabled site groups that are granted right now (read live, REQ-PRIV-002). */
async function desiredMatches(
  state: SiteMarkState,
  permissions: SyncRegistrationDeps['permissions'],
): Promise<string[]> {
  const origins = originsOfEnabledSiteGroups(state);
  const granted = await Promise.all(origins.map((origin) => permissions.contains([origin])));
  return origins.filter((_, index) => granted[index]);
}

function sameMatches(registration: MarkerRegistration, desired: readonly string[]): boolean {
  const current = new Set(registration.matches);
  return current.size === desired.length && desired.every((match) => current.has(match));
}

/** Failures need no handling here: the adapter logs them and the next sync tries again. */
async function reconcile(registrar: ScriptRegistrar, desired: readonly string[]): Promise<void> {
  const current = await registrar.getRegistered();
  if (desired.length === 0) {
    if (current) await registrar.unregister();
    return;
  }
  if (!current) await registrar.register({ matches: desired });
  else if (!sameMatches(current, desired)) await registrar.update({ matches: desired });
}

async function syncOnce(deps: SyncRegistrationDeps): Promise<void> {
  const loaded = await deps.stateRepo.load();
  // Data from a newer version can't be interpreted: leave its registration as it is (REQ-DATA-007).
  if (loaded.mode === 'readOnly') return;
  await reconcile(deps.registrar, await desiredMatches(loaded.state, deps.permissions));
}

/** Single-flight: a call during a sync marks it dirty, and the running sync then goes once more. */
export function createSyncRegistration(deps: SyncRegistrationDeps): SyncRegistration {
  let running: Promise<void> | undefined;
  let dirty = false;
  const run = async () => {
    try {
      do {
        dirty = false;
        await syncOnce(deps).catch((error: unknown) => {
          deps.logger.error('Could not sync the marker registration', error);
        });
      } while (dirty);
    } finally {
      running = undefined;
    }
  };
  return () => {
    if (running !== undefined) {
      dirty = true;
      return running;
    }
    running = run();
    return running;
  };
}
