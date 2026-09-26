import type { IdGen } from '../core/ids';
import type { OriginPattern } from '../core/url/origin';
import { parseOriginPattern } from '../core/url/origin';
import { type CommandQueue, createCommandQueue } from './command-queue';
import type {
  Badge,
  Logger,
  Permissions,
  ScriptRegistrar,
  StateRepo,
  Tabs,
  Unsubscribe,
} from './ports';
import type { BackgroundHandlers, ContentHandlers, ContentSender, PageHandlers } from './protocol';
import { type GrantDeps, watchPermissions } from './use-cases/grant';
import { applyImportFile, type ImportDataDeps, previewImportFile } from './use-cases/import-data';
import { type CommandName, runKeyboardCommand } from './use-cases/keyboard-command';
import { markThisSite } from './use-cases/mark-this-site';
import { pushPlans, renderPlanFor } from './use-cases/render-plan';
import { reportStatus, showReadOnlyBadges } from './use-cases/report-status';
import { savePick } from './use-cases/save-pick';
import { startPicker } from './use-cases/start-picker';
import { createSyncRegistration } from './use-cases/sync-registration';
import { requestTabStatus } from './use-cases/tab-status';
import { toggleHidden } from './use-cases/toggle-hidden';

// The background's composition of use cases (T-076, plan §3). No browser API here: the ports come
// from src/platform (src/platform/background-wiring.ts) or from in-memory fakes in tests. Nothing
// in here must survive a restart: the queue's promise chain and the sync's single-flight flag only
// order work within one service-worker lifetime; the stored state is the only truth (plan §3.1).

/** Everything the background needs from the browser, as ports (the platform adapters in production). */
export type BackgroundPorts = {
  readonly stateRepo: StateRepo;
  readonly permissions: Permissions;
  readonly registrar: ScriptRegistrar;
  readonly tabs: Tabs;
  readonly badge: Badge;
  readonly logger: Logger;
  readonly idGen: IdGen;
  readonly markerFiles: readonly string[];
  readonly pickerFiles: readonly string[];
  /** Opens the options page at a route; `false` for an unknown route (src/platform/deep-links.ts). */
  readonly openOptions: (route: string) => Promise<boolean>;
  /** grant.html for these origins (src/platform/grant-page.ts). */
  readonly grantPageUrl: (origins: readonly OriginPattern[]) => string;
};

/** The background's behaviour, without any listener: the composition root registers those. */
export type BackgroundApp = {
  /** One handler per protocol message (src/platform/messaging.ts routes to them). */
  readonly handlers: BackgroundHandlers;
  /** A keyboard command on a tab (src/platform/commands.ts resolves the tab). */
  runCommand(name: CommandName, tabId: number): Promise<void>;
  /** Runs on every background start (plan §3.1): registration sync and read-only badges. */
  start(): Promise<void>;
  /** `runtime.onInstalled`: the welcome tab on a fresh install (REQ-OPT-001), then a sync. */
  installed(reason: string): Promise<void>;
  /** Completes grants and follows revocations (D-229); the listeners are the ports'. */
  watchPermissions(): Unsubscribe;
};

type Wired = {
  readonly ports: BackgroundPorts;
  readonly grant: GrantDeps;
  readonly data: ImportDataDeps;
  readonly queue: CommandQueue;
};

function wire(ports: BackgroundPorts): Wired {
  const { stateRepo, permissions, registrar, tabs, logger, idGen, markerFiles } = ports;
  const syncRegistration = createSyncRegistration({ stateRepo, permissions, registrar, logger });
  const queue = createCommandQueue({
    repo: stateRepo,
    idGen,
    logger,
    // Every saved change: new plans to the tabs (REQ-RND-007), registration in step (D-231).
    onCommitted: async (state) => {
      await Promise.all([pushPlans(tabs, state), syncRegistration()]);
    },
  });
  const grant: GrantDeps = { syncRegistration, registrar, tabs, markerFiles };
  return { ports, grant, queue, data: { stateRepo, permissions, queue, idGen, grant } };
}

function pageHandlers({ ports, grant, queue, data }: Wired): PageHandlers {
  const { tabs, badge, pickerFiles } = ports;
  return {
    command: (command) => queue.dispatch(command),
    getState: async () => (await ports.stateRepo.load()).state,
    startPicker: (request) => startPicker({ tabs, badge, pickerFiles }, request),
    toggleHidden: ({ tabId }) => toggleHidden(tabs, tabId),
    getTabStatus: async ({ tabId }) => {
      // A failed injection (startPicker) is the ground truth for restricted pages (REQ-POP-005).
      const status = await requestTabStatus(tabs, tabId);
      return status.ok ? status.value : 'not-injected';
    },
    markThisSite: (request) => markThisSite({ ...grant, queue }, request),
    importPreview: (file) => previewImportFile(data, file),
    importApply: (request) => applyImportFile(data, request),
  };
}

/** `*://host/*` for the sender's host: the origin its "New site group" pattern needs. */
function senderOrigin({ origin }: ContentSender): OriginPattern | undefined {
  const parsed = parseOriginPattern(`*://${new URL(origin).hostname}/*`);
  return parsed.ok ? parsed.value : undefined;
}

function contentHandlers({ ports, queue }: Wired): ContentHandlers {
  const { stateRepo, badge, tabs, idGen } = ports;
  return {
    renderPlanFor: (_, sender) => renderPlanFor(stateRepo, sender.url),
    reportStatus: (status, sender) => reportStatus({ badge, stateRepo }, sender.tabId, status),
    savePick: (pick, sender) => savePick({ queue, idGen }, pick, sender),
    requestGrant: async (_, sender) => {
      const origin = senderOrigin(sender);
      if (origin) await tabs.create(ports.grantPageUrl([origin]));
    },
    openOptions: async ({ route }) => {
      await ports.openOptions(route);
    },
  };
}

/** Wires the use cases to the ports (T-076). Holds nothing that must survive a restart. */
export function createBackgroundApp(ports: BackgroundPorts): BackgroundApp {
  const wired = wire(ports);
  const { stateRepo, badge, tabs, permissions } = ports;
  const { syncRegistration } = wired.grant;
  return {
    handlers: { ...pageHandlers(wired), ...contentHandlers(wired) },
    runCommand: (name, tabId) => runKeyboardCommand(ports, name, tabId),
    start: async () => {
      await Promise.all([syncRegistration(), showReadOnlyBadges({ badge, stateRepo, tabs })]);
    },
    installed: async (reason) => {
      if (reason === 'install') await ports.openOptions('/welcome');
      await syncRegistration();
    },
    watchPermissions: () => watchPermissions(permissions, wired.grant),
  };
}
