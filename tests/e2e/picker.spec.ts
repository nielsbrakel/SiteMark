import type { BrowserContext, Page } from '@playwright/test';
import { sendFromPage } from './background';
import { expect, test } from './fixtures';
import { fixtureUrl } from './hosts';
import { centerOf, pickerPart, startPicking } from './picker';

// The picker end to end (REQ-PICK-001, REQ-PICK-005): select an element, save it from the panel.

type StoredGroup = {
  name: string;
  marks: { target: { kind: string; selector?: string }; effects: Record<string, unknown> }[];
};
type Stored = { ok: true; value: { siteGroups: StoredGroup[] } };

/** The stored state, read through getState from an extension page. */
async function storedGroups(context: BrowserContext, extensionId: string): Promise<StoredGroup[]> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  const reply = (await sendFromPage(page, { type: 'getState' })) as Stored;
  await page.close();
  return reply.value.siteGroups;
}

/** Clicks the element with a real (trusted) mouse click through the glass pane. */
async function pick(page: Page, testId: string): Promise<void> {
  const { x, y } = await centerOf(page.getByTestId(testId));
  await page.mouse.click(x, y);
}

test('selecting an element opens the panel with its selector @REQ-PICK-005', async ({
  context,
  page,
  serviceWorker,
}) => {
  await page.goto(fixtureUrl('prod', 'picker.html'));
  await startPicking(context, page, serviceWorker);
  await pick(page, 'danger');
  const panel = pickerPart(page, 'panel');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('textbox', { name: 'Selector' })).toHaveValue('#danger');
  await expect(panel.locator('[data-part="match"]')).toHaveText('✓ matches');
  await expect(panel.getByRole('combobox', { name: 'Site group' })).toContainText(
    'New site group for prod.sitemark.test',
  );
});

test('Save stores the element mark and ends the pick @REQ-PICK-005', async ({
  context,
  page,
  serviceWorker,
  extensionId,
}) => {
  await page.goto(fixtureUrl('prod', 'picker.html'));
  await startPicking(context, page, serviceWorker);
  await pick(page, 'danger');
  const panel = pickerPart(page, 'panel');
  await expect(panel).toBeVisible();
  await panel.getByRole('button', { name: 'Ribbon' }).click();
  await panel.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('sitemark-picker')).toHaveCount(0);
  const groups = await storedGroups(context, extensionId);
  expect(groups.map((group) => group.name)).toEqual(['prod.sitemark.test']);
  expect(groups[0]?.marks.map((mark) => mark.target)).toEqual([
    { kind: 'element', selector: '#danger' },
  ]);
  expect(Object.keys(groups[0]?.marks[0]?.effects ?? {}).sort()).toEqual(['outline', 'ribbon']);
});

test('Cancel and Esc end the pick without saving @REQ-PICK-005', async ({
  context,
  page,
  serviceWorker,
  extensionId,
}) => {
  await page.goto(fixtureUrl('prod', 'picker.html'));
  await startPicking(context, page, serviceWorker);
  await pick(page, 'danger');
  await expect(pickerPart(page, 'panel')).toBeVisible();
  await pickerPart(page, 'panel').getByRole('button', { name: 'Cancel' }).click();
  await expect(page.locator('sitemark-picker')).toHaveCount(0);
  await startPicking(context, page, serviceWorker);
  await pick(page, 'link');
  await expect(pickerPart(page, 'panel')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('sitemark-picker')).toHaveCount(0);
  expect(await storedGroups(context, extensionId)).toEqual([]);
});

test('More options… saves and opens the options page at the new mark @REQ-PICK-005', async ({
  context,
  page,
  serviceWorker,
}) => {
  await page.goto(fixtureUrl('prod', 'picker.html'));
  await startPicking(context, page, serviceWorker);
  await pick(page, 'danger');
  await expect(pickerPart(page, 'panel')).toBeVisible();
  const options = context.waitForEvent('page', { timeout: 10_000 }).catch(() => undefined);
  await pickerPart(page, 'panel').getByRole('button', { name: 'More options…' }).click();
  await expect(page.locator('sitemark-picker')).toHaveCount(0);
  const opened = await options;
  await expect
    .poll(() => opened?.url() ?? 'no tab')
    .toMatch(/options\.html#\/groups\/[\w-]{12}\/marks\/[\w-]{12}$/);
});
