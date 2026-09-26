import type { Worker } from '@playwright/test';
import { dispatchCommand, restartServiceWorker, sendFromPage } from './background';
import { expect, test } from './fixtures';
import { E2E_PORT } from './hosts';

// The background composition root in the real extension (T-074, T-076).

type ScriptingApi = {
  scripting: {
    getRegisteredContentScripts(): Promise<{ id: string; matches?: string[] }[]>;
    unregisterContentScripts(filter?: { ids?: string[] }): Promise<void>;
  };
  tabs: { query(info: object): Promise<{ id?: number }[]> };
  action: { getBadgeText(details: { tabId: number }): Promise<string> };
};

const registeredMatches = (worker: Worker) =>
  worker.evaluate(async () => {
    const { chrome } = globalThis as unknown as { chrome: ScriptingApi };
    const scripts = await chrome.scripting.getRegisteredContentScripts();
    return scripts.map((script) => script.matches ?? []);
  });

const activeTabBadge = (worker: Worker) =>
  worker.evaluate(async () => {
    const { chrome } = globalThis as unknown as { chrome: ScriptingApi };
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return tab?.id === undefined ? 'no tab' : chrome.action.getBadgeText({ tabId: tab.id });
  });

test('the welcome tab opens on install @REQ-OPT-001', async ({ context }) => {
  const welcome = () =>
    context.pages().some((page) => page.url().endsWith('/options.html#/welcome'));
  await expect.poll(welcome).toBe(true);
});

test('every background start re-syncs the marker registration @REQ-PRIV-003', async ({
  context,
  page,
  extensionId,
  serviceWorker,
}) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  const origin = { hostname: 'prod.sitemark.test', port: String(E2E_PORT) };
  const reply = await sendFromPage(page, { type: 'markThisSite', data: { tabId: 0, origin } });
  expect(reply).toEqual({ ok: true, value: { ok: true, value: { revision: 1, notices: [] } } });
  await expect.poll(() => registeredMatches(serviceWorker)).toEqual([['*://prod.sitemark.test/*']]);

  // The browser drops the registration (Safari treats it as a cache, D-231); a restart restores it.
  await serviceWorker.evaluate(async () => {
    const { chrome } = globalThis as unknown as { chrome: ScriptingApi };
    await chrome.scripting.unregisterContentScripts();
  });
  const restarted = await restartServiceWorker(context, extensionId);
  await expect.poll(() => registeredMatches(restarted)).toEqual([['*://prod.sitemark.test/*']]);
});

test('start-picker briefly shows "✕" where it can not run @REQ-CMD-001', async ({
  context,
  page,
  serviceWorker,
}) => {
  // Wait for the welcome tab first, so the page below stays the active tab.
  const welcome = () => context.pages().some((tab) => tab.url().includes('/options.html'));
  await expect.poll(welcome).toBe(true);
  await page.goto('chrome://version/');
  await page.bringToFront();
  expect(await dispatchCommand(serviceWorker, 'start-picker')).toBe(true);
  expect(await activeTabBadge(serviceWorker)).toBe('✕');
  await expect.poll(() => activeTabBadge(serviceWorker), { timeout: 5000 }).toBe('');
});
