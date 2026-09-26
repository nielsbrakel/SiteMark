import { browser } from 'wxt/browser';
import { type BackgroundApp, createBackgroundApp } from '../app/background-app';
import type { Logger, Tabs } from '../app/ports';
import { createIdGen } from '../core/ids';
import { createBadge } from './badge';
import { createCommandDispatcher, listenForCommands } from './commands';
import { openOptions } from './deep-links';
import { exposeE2eHooks } from './e2e-hooks';
import { grantPageUrl } from './grant-page';
import { createConsoleLogger } from './logger';
import { listenForMessages } from './messaging';
import { createPermissions } from './permissions';
import { pickerFiles } from './picker-files';
import { createScriptRegistrar, markerFiles } from './registration';
import { createStateRepo, restrictStorageAccess } from './state-repo';
import { createTabs } from './tabs';

// The background's adapters and listeners (T-076, plan §3.1). Every listener is registered
// synchronously, in one pass, so an event that woke the service worker is never missed.

function createApp(logger: Logger, tabs: Tabs): BackgroundApp {
  return createBackgroundApp({
    stateRepo: createStateRepo({ clock: { now: () => Date.now() }, logger }),
    permissions: createPermissions(logger),
    registrar: createScriptRegistrar(logger),
    tabs,
    badge: createBadge(logger),
    logger,
    idGen: createIdGen((bytes) => crypto.getRandomValues(bytes)),
    markerFiles: markerFiles(),
    pickerFiles: pickerFiles(),
    openOptions: (route) => openOptions(tabs, route),
    grantPageUrl,
  });
}

/** Everything that runs on each start of the background (plan §3.1). */
function onStart(app: BackgroundApp, logger: Logger): void {
  void restrictStorageAccess(logger);
  void app.start();
}

/**
 * Starts the background: adapters, then every listener synchronously, then the start-up work
 * (storage access level, registration sync, read-only badges). Call it once from `main()`.
 */
export function startBackground(): void {
  const logger = createConsoleLogger();
  const tabs = createTabs(logger);
  const app = createApp(logger, tabs);
  const dispatch = createCommandDispatcher(app.runCommand, tabs);
  listenForMessages(app.handlers, logger);
  app.watchPermissions();
  listenForCommands(dispatch);
  browser.runtime.onInstalled.addListener(({ reason }) => void app.installed(reason));
  // Browser start: main() below already runs the start-up work; the listener makes sure an event
  // page (Firefox) is woken for it at all.
  browser.runtime.onStartup.addListener(() => undefined);
  if (import.meta.env.MODE === 'e2e') exposeE2eHooks(dispatch);
  onStart(app, logger);
}
