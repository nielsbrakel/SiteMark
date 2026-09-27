import type { BrowserContext, Page, Worker } from '@playwright/test';

// Opens the popup for a tab. It is opened as popup.html?tabId=<id> in a tab of its own, which only
// e2e builds honour (src/ui/hooks/use-current-tab.ts): Playwright can't click the toolbar button.

export type TabsApi = { tabs: { query(info: object): Promise<{ id?: number; url?: string }[]> } };

/** The id of the tab showing `url` (visible to the background on granted origins only). */
async function tabIdOf(worker: Worker, url: string): Promise<number> {
  const id = await worker.evaluate(async (wanted) => {
    const { chrome } = globalThis as unknown as { chrome: TabsApi };
    const tabs = await chrome.tabs.query({});
    return tabs.find((tab) => tab.url === wanted)?.id;
  }, url);
  if (id === undefined) throw new Error(`No tab shows ${url}`);
  return id;
}

/** Opens `url` in a tab and the popup for that tab in another; returns both pages. */
export async function openPopupFor(
  context: BrowserContext,
  worker: Worker,
  extensionId: string,
  url: string,
): Promise<{ site: Page; popup: Page }> {
  const site = await context.newPage();
  await site.goto(url);
  const tabId = await tabIdOf(worker, site.url());
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html?tabId=${tabId}`);
  return { site, popup };
}
