import type { IdGen } from '../core/ids';
import { notImplemented } from '../core/not-implemented';
import type { OriginPattern } from '../core/url/origin';
import type {
  Badge,
  Logger,
  Permissions,
  ScriptRegistrar,
  StateRepo,
  Tabs,
  Unsubscribe,
} from './ports';
import type { BackgroundHandlers } from './protocol';
import type { CommandName } from './use-cases/keyboard-command';

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

/** Wires the use cases to the ports (T-076). Holds nothing that must survive a restart. */
export function createBackgroundApp(_ports: BackgroundPorts): BackgroundApp {
  return notImplemented();
}
