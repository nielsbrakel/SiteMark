import type { Worker } from '@playwright/test';
import { dispatchCommand, restartServiceWorker, sendFromPage } from './background';
import { expect, test } from './fixtures';
import { E2E_PORT, fixtureUrl } from './hosts';
import { waitForMarker } from './marker';
import { seedSiteGroup } from './state';

// The background composition root in the real extension (T-074, T-076).

type ScriptingApi = {
  scripting: {
    getRegisteredContentScripts(): Promise<{ id: string; matches?: string[] }[]>;
    unregisterContentScripts(filter?: { ids?: string[] }): Promise<void>;
  };
  tabs: { query(info: object): Promise<{ id?: number }[]> };
  action: { setIcon(details: { path: Record<number, string> }): Promise<void> };
};

const registeredMatches = (worker: Worker) =>
  worker.evaluate(async () => {
    const { chrome } = globalThis as unknown as { chrome: ScriptingApi };
    const scripts = await chrome.scripting.getRegisteredContentScripts();
    return scripts.map((script) => script.matches ?? []);
  });

/** Records the icon files the background sets on a tab: Chrome has no API to read an icon back. */
const recordIcons = (worker: Worker) =>
  worker.evaluate(() => {
    const { chrome } = globalThis as unknown as { chrome: ScriptingApi };
    const seen: string[] = [];
    const setIcon = chrome.action.setIcon.bind(chrome.action);
    chrome.action.setIcon = async (details) => {
      await setIcon(details);
      seen.push(details.path[16] ?? '');
    };
    Object.assign(globalThis, { seenIcons: seen });
  });

const seenIcons = (worker: Worker) =>
  worker.evaluate(() => (globalThis as unknown as { seenIcons: string[] }).seenIcons);

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

test('start-picker briefly puts the "✕" sticker on the icon where it can not run @REQ-CMD-001', async ({
  context,
  page,
  serviceWorker,
}) => {
  // Wait for the welcome tab first, so the page below stays the active tab.
  const welcome = () => context.pages().some((tab) => tab.url().includes('/options.html'));
  await expect.poll(welcome).toBe(true);
  await page.goto('chrome://version/');
  await page.bringToFront();
  await recordIcons(serviceWorker);
  expect(await dispatchCommand(serviceWorker, 'start-picker')).toBe(true);
  expect(await seenIcons(serviceWorker)).toEqual(['icon/restricted-16.png']);
  await expect
    .poll(() => seenIcons(serviceWorker), { timeout: 5000 })
    .toEqual(['icon/restricted-16.png', 'icon/16.png']);
});

test('the icon carries the active and hidden stickers on a marked site @REQ-POP-010', async ({
  context,
  extensionId,
  serviceWorker,
}) => {
  await seedSiteGroup(context, extensionId, {
    patterns: ['*://prod.sitemark.test/*'],
    marks: [
      {
        enabled: true,
        color: '#c93a2e',
        textColor: 'auto',
        target: { kind: 'page' },
        effects: { ribbon: { text: 'PROD', corner: 'top-right' } },
      },
    ],
  });
  await recordIcons(serviceWorker);
  const page = await context.newPage();
  await page.goto(fixtureUrl('prod'));
  await page.bringToFront();
  await waitForMarker(page);
  await expect.poll(() => seenIcons(serviceWorker)).toEqual(['icon/active-16.png']);
  expect(await dispatchCommand(serviceWorker, 'toggle-hide')).toBe(true);
  await expect
    .poll(() => seenIcons(serviceWorker))
    .toEqual(['icon/active-16.png', 'icon/hidden-16.png']);
});
