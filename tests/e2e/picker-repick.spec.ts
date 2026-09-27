import type { BrowserContext, Page, Worker } from '@playwright/test';
import { sendFromPage } from './background';
import { expect, test } from './fixtures';
import { E2E_PORT, fixtureUrl } from './hosts';
import { centerOf, waitForPanel, waitForPicker } from './picker';

// Re-pick (REQ-PICK-007, D-269): the popup offers it for a mark whose element isn't found; the
// background injects the picker and tells it which mark it replaces.

type Mark = { id: string; target: { kind: string; selector?: string } };
type Group = { id: string; marks: Mark[] };
type Reply<T> = { ok: true; value: T };

async function extensionPage(context: BrowserContext, extensionId: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  return page;
}

async function groups(page: Page): Promise<Group[]> {
  const reply = (await sendFromPage(page, { type: 'getState' })) as Reply<{ siteGroups: Group[] }>;
  return reply.value.siteGroups;
}

/** The ID of the tab showing `url` (visible to the background: the fixture host is granted). */
function tabIdOf(worker: Worker, url: string): Promise<number> {
  return worker.evaluate(async (target) => {
    type TabsApi = { tabs: { query(info: object): Promise<{ id?: number; url?: string }[]> } };
    const { chrome } = globalThis as unknown as { chrome: TabsApi };
    const tabs = await chrome.tabs.query({});
    return tabs.find((tab) => tab.url === target)?.id ?? -1;
  }, url);
}

/** "Mark this site" on the fixture tab, plus an element mark whose target is gone. */
async function seedLostMark(
  page: Page,
  tabId: number,
): Promise<{ groupId: string; markId: string }> {
  const origin = { hostname: 'prod.sitemark.test', port: String(E2E_PORT) };
  await sendFromPage(page, { type: 'markThisSite', data: { tabId, origin } });
  const [group] = await groups(page);
  const mark = {
    enabled: true,
    color: '#1f6feb',
    textColor: 'auto',
    target: { kind: 'element', selector: '#gone' },
    effects: { outline: { widthPx: 3, style: 'solid', pulse: false } },
  };
  await sendFromPage(page, {
    type: 'command',
    data: { type: 'addMark', groupId: group?.id, mark },
  });
  const lost = (await groups(page))[0]?.marks.find((m) => m.target.kind === 'element');
  return { groupId: group?.id ?? '', markId: lost?.id ?? '' };
}

test('a re-pick replaces the selector of that mark and keeps the mark @REQ-PICK-007', async ({
  context,
  page,
  serviceWorker,
  extensionId,
}) => {
  const url = fixtureUrl('prod', 'picker.html');
  await page.goto(url);
  const tabId = await tabIdOf(serviceWorker, url);
  const extension = await extensionPage(context, extensionId);
  const { markId } = await seedLostMark(extension, tabId);
  await sendFromPage(extension, { type: 'startPicker', data: { tabId, repickMarkId: markId } });
  await page.bringToFront();
  await waitForPicker(page);
  const { x, y } = await centerOf(page.getByTestId('danger'));
  await page.mouse.click(x, y);
  const panel = await waitForPanel(page);
  await panel.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('sitemark-picker')).toHaveCount(0);
  const marks = (await groups(extension))[0]?.marks ?? [];
  expect(marks.filter((mark) => mark.target.kind === 'element')).toEqual([
    expect.objectContaining({ id: markId, target: { kind: 'element', selector: '#danger' } }),
  ]);
});
