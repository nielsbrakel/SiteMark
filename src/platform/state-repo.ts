import { browser } from 'wxt/browser';
import type { LoadedState, Logger, SaveError, StateRepo } from '../app/ports';
import { type MigrateOk, type MigrationSteps, migrate } from '../core/data/migrate';
import type { Clock } from '../core/ids';
import { emptyState } from '../core/model/defaults';
import type { SiteMarkState } from '../core/model/schema';
import { assertNever, err, ok, type Result } from '../core/result';
import { backUp, readBackups } from './state-backups';

export type StateRepoDeps = {
  readonly clock: Clock;
  readonly logger: Logger;
  /** Tests inject steps; production uses the registry in src/core/data/migrate.ts. */
  readonly steps?: MigrationSteps;
};

const STATE_KEY = 'sitemark:state';
const CURRENT_SCHEMA_VERSION: number = emptyState().schemaVersion;

async function readRaw(): Promise<unknown> {
  return (await browser.storage.local.get(STATE_KEY))[STATE_KEY];
}

/** Written by a newer SiteMark (the same rule as `migrate`'s read-only result). */
function isNewer(raw: unknown): boolean {
  if (typeof raw !== 'object' || raw === null) return false;
  const version: unknown = (raw as { schemaVersion?: unknown }).schemaVersion;
  return Number.isSafeInteger(version) && (version as number) > CURRENT_SCHEMA_VERSION;
}

/**
 * The StateRepo adapter over `storage.local` (never `storage.sync`, REQ-PRIV-006). The state lives
 * under `sitemark:state`, unreadable data in the rotating backups `sitemark:backup:0…2`.
 * Stateless: the service worker may restart between any two calls (plan §3.1).
 */
export function createStateRepo({ clock, logger, steps }: StateRepoDeps): StateRepo {
  async function write(state: SiteMarkState): Promise<Result<void, SaveError>> {
    try {
      await browser.storage.local.set({ [STATE_KEY]: structuredClone(state) });
      return ok(undefined);
    } catch (error) {
      logger.error('Saving the state failed', error);
      return err('storageFailed');
    }
  }

  async function loaded({ state, fromVersion }: MigrateOk): Promise<LoadedState> {
    if (fromVersion < state.schemaVersion) await write(state);
    return { mode: 'normal', state };
  }

  async function load(): Promise<LoadedState> {
    const raw = await readRaw();
    if (raw === undefined) return { mode: 'normal', state: emptyState() };
    const migrated = migrate(raw, steps);
    if (migrated.ok) return loaded(migrated.value);
    const failure = migrated.error;
    switch (failure.code) {
      case 'stateReadOnly':
        return { mode: 'readOnly', state: emptyState(), schemaVersion: failure.schemaVersion };
      case 'stateUnreadable': {
        const backup = await backUp(raw, clock.now());
        logger.warn(`The stored state is unreadable; it is kept in backup ${backup.slot}`);
        return { mode: 'recovered', state: emptyState(), backup };
      }
      default:
        return assertNever(failure);
    }
  }

  return {
    load,
    save: async (state) => (isNewer(await readRaw()) ? err('stateReadOnly') : write(state)),
    backups: readBackups,
  };
}

/** The part of a storage area T-063 needs; Firefox and Safari may lack `setAccessLevel`. */
export type AccessLevelArea = {
  setAccessLevel?: (options: { accessLevel: 'TRUSTED_CONTEXTS' }) => Promise<void>;
};

/**
 * Keeps content scripts away from `storage.local` where the browser supports it (REQ-SEC-002,
 * D-221). Resolves `true` when the access level is set; never rejects.
 */
export async function restrictStorageAccess(
  logger: Logger,
  area: AccessLevelArea = browser.storage.local,
): Promise<boolean> {
  if (typeof area.setAccessLevel !== 'function') return false;
  try {
    await area.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
    return true;
  } catch (error) {
    logger.warn('Could not restrict the storage access level to trusted contexts', error);
    return false;
  }
}
