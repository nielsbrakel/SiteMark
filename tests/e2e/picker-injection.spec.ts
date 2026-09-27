import type { Worker } from '@playwright/test';
import { dispatchCommand, sendFromPage } from './background';
import { expect, test } from './fixtures';
import { fixtureUrl } from './hosts';
import { startPicking, waitForPicker } from './picker';

// How the picker gets into a page (REQ-PICK-001, REQ-CMD-001): the popup's "Pick element" sends
// startPicker for its tab, the start-picker shortcut runs on the active tab. Both inject the
// picker on demand; invoking it again while it runs cancels it.

/** The ID of the tab showing `url` (the fixture host is granted, so the background sees it). */
function tabIdOf(worker: Worker, url: string): Promise<number> {
  return worker.evaluate(async (target) => {
    type TabsApi = { tabs: { query(info: object): Promise<{ id?: number; url?: string }[]> } };
    const { chrome } = globalThis as unknown as { chrome: TabsApi };
    const tabs = await chrome.tabs.query({});
    return tabs.find((tab) => tab.url === target)?.id ?? -1;
  }, url);
}

test('startPicker from the popup injects the picker into its tab @REQ-PICK-001', async ({
  context,
  page,
  serviceWorker,
  extensionId,
}) => {
  const url = fixtureUrl('prod', 'picker.html');
  await page.goto(url);
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  const tabId = await tabIdOf(serviceWorker, url);
  const reply = await sendFromPage(popup, { type: 'startPicker', data: { tabId } });
  expect(reply).toEqual({ ok: true, value: { ok: true, value: undefined } });
  await waitForPicker(page);
});

test('the start-picker shortcut toggles the picker @REQ-PICK-001 @REQ-CMD-001', async ({
  context,
  page,
  serviceWorker,
}) => {
  await page.goto(fixtureUrl('prod', 'picker.html'));
  await startPicking(context, page, serviceWorker);
  expect(await dispatchCommand(serviceWorker, 'start-picker')).toBe(true);
  await expect(page.locator('sitemark-picker')).toHaveCount(0);
  expect(await dispatchCommand(serviceWorker, 'start-picker')).toBe(true);
  await waitForPicker(page);
});
