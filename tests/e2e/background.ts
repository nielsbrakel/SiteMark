import { type BrowserContext, expect, type Page, type Worker } from '@playwright/test';

// Helpers that drive the extension's background (D-233): `dispatchCommand` (T-074) and
// `restartServiceWorker` (T-076). They return what happened instead of throwing, so a test fails
// on its own assertion.

/** The e2e-only hook the background exposes in `wxt build --mode e2e` (src/platform/e2e-hooks.ts). */
type E2eHooks = { dispatchCommand(name: string): Promise<void> };

/**
 * Runs a keyboard command in the background as if its shortcut was pressed on the active tab
 * (a real shortcut can't be pressed from Playwright). `false` when the hook is missing.
 */
export function dispatchCommand(worker: Worker, name: string): Promise<boolean> {
  return worker.evaluate(async (command) => {
    const hooks = (globalThis as { sitemarkE2e?: E2eHooks }).sitemarkE2e;
    if (!hooks) return false;
    await hooks.dispatchCommand(command);
    return true;
  }, name);
}

type RuntimeApi = { runtime: { sendMessage(message: unknown): Promise<unknown> } };

/** Sends a runtime message from an extension page; a failure comes back as `{ error }`. */
export function sendFromPage(page: Page, message: unknown): Promise<unknown> {
  return page.evaluate(async (payload) => {
    const { chrome } = globalThis as unknown as { chrome: RuntimeApi };
    try {
      return await chrome.runtime.sendMessage(payload);
    } catch (error) {
      return { error: String(error) };
    }
  }, message);
}

type RunningStatus = 'stopped' | 'starting' | 'running' | 'stopping';
type VersionUpdate = { versions: { scriptURL: string; runningStatus: RunningStatus }[] };

/**
 * Stops the extension's service worker, like Chrome does after 30 s idle, and wakes it again with
 * a message from an extension page: a fresh global scope, where every top-level listener and the
 * start-up sync run again (plan §3.1). Playwright keeps the same Worker handle, now pointing at
 * the new instance, and it is returned once the worker runs again.
 */
export async function restartServiceWorker(
  context: BrowserContext,
  extensionId: string,
): Promise<Worker> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  const cdp = await context.newCDPSession(page);
  const statuses: RunningStatus[] = [];
  cdp.on('ServiceWorker.workerVersionUpdated', ({ versions }: VersionUpdate) => {
    for (const version of versions) {
      if (version.scriptURL.includes(extensionId)) statuses.push(version.runningStatus);
    }
  });
  const reached = (status: RunningStatus) => expect.poll(() => statuses.at(-1)).toBe(status);
  await cdp.send('ServiceWorker.enable');
  await cdp.send('ServiceWorker.stopAllWorkers');
  await reached('stopped');
  await sendFromPage(page, { type: 'getState' });
  await reached('running');
  await page.close();
  const worker = context
    .serviceWorkers()
    .find((candidate) => candidate.url().includes(extensionId));
  if (!worker) throw new Error('The extension service worker did not come back');
  return worker;
}
