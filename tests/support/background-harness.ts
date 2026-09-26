import { createCommandQueue } from '../../src/app/command-queue';
import type { LoadedState } from '../../src/app/ports';
import { createInMemoryBadge } from '../../src/app/testing/in-memory-badge';
import { createInMemoryLogger } from '../../src/app/testing/in-memory-logger';
import { createInMemoryPermissions } from '../../src/app/testing/in-memory-permissions';
import { createInMemoryScriptRegistrar } from '../../src/app/testing/in-memory-script-registrar';
import { createInMemoryStateRepo } from '../../src/app/testing/in-memory-state-repo';
import { createInMemoryTabs, type InMemoryTab } from '../../src/app/testing/in-memory-tabs';
import type { GrantDeps } from '../../src/app/use-cases/grant';
import { createSyncRegistration } from '../../src/app/use-cases/sync-registration';
import { emptyState } from '../../src/core/model/defaults';
import type { SiteMarkState } from '../../src/core/model/schema';
import { fixedIdGen } from '../../src/core/testing/test-doubles';

// The background's ports as in-memory fakes, wired like the composition root does it, for the
// use-case tests of T-071…T-076.

export const MARKER_FILES = ['content-scripts/content.js'] as const;

export type HarnessOptions = {
  readonly state?: SiteMarkState;
  /** Overrides `state`, e.g. a read-only load. */
  readonly loaded?: LoadedState;
  readonly tabs?: readonly InMemoryTab[];
  readonly granted?: readonly string[];
};

export function backgroundHarness(options: HarnessOptions = {}) {
  const loaded = options.loaded ?? { mode: 'normal', state: options.state ?? emptyState() };
  const repo = createInMemoryStateRepo({ loaded });
  const permissions = createInMemoryPermissions(options.granted);
  const registrar = createInMemoryScriptRegistrar();
  const tabs = createInMemoryTabs(options.tabs);
  const badge = createInMemoryBadge();
  const logger = createInMemoryLogger();
  const idGen = fixedIdGen();
  const syncRegistration = createSyncRegistration({
    stateRepo: repo,
    permissions,
    registrar,
    logger,
  });
  const queue = createCommandQueue({ repo, idGen, logger, onCommitted: () => syncRegistration() });
  const grant: GrantDeps = { syncRegistration, registrar, tabs, markerFiles: MARKER_FILES };
  /** The state as stored right now. */
  const stored = async (): Promise<SiteMarkState> => (await repo.load()).state;
  return {
    repo,
    permissions,
    registrar,
    tabs,
    badge,
    logger,
    idGen,
    queue,
    syncRegistration,
    grant,
    stored,
  };
}
