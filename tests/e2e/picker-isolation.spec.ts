import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { fixtureUrl } from './hosts';
import { centerOf, pickerPart, startPicking } from './picker';

// Zero page side effects while picking (REQ-PICK-003, D-240): the glass pane takes every pointer
// event and the keyboard focus, so no page handler runs. tests/e2e/site/picker.js counts them.

type Stats = Record<
  'click' | 'pointerdown' | 'mousedown' | 'focus' | 'keydown' | 'windowCapture' | 'navigated',
  number
>;
type StatsWindow = { pickerStats: Stats & { reset(): void } };

const stats = (page: Page) =>
  page.evaluate(() => {
    const { reset: _, ...counts } = (window as unknown as StatsWindow).pickerStats;
    return counts;
  });
const resetStats = (page: Page) =>
  page.evaluate(() => (window as unknown as StatsWindow).pickerStats.reset());

const NONE: Stats = {
  click: 0,
  pointerdown: 0,
  mousedown: 0,
  focus: 0,
  keydown: 0,
  windowCapture: 0,
  navigated: 0,
};

test('pointing and clicking never reach page handlers @REQ-PICK-003', async ({
  context,
  page,
  serviceWorker,
}) => {
  await page.goto(fixtureUrl('prod', 'picker.html'));
  await startPicking(context, page, serviceWorker);
  await resetStats(page);
  for (const id of ['danger', 'link', 'field']) {
    const { x, y } = await centerOf(page.getByTestId(id));
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.up();
  }
  await page.mouse.dblclick(10, 10);
  expect(await stats(page)).toEqual(NONE);
  await expect(page).toHaveURL(fixtureUrl('prod', 'picker.html'));
});

test('keys never reach the focused page element or the page @REQ-PICK-003', async ({
  context,
  page,
  serviceWorker,
}) => {
  await page.goto(fixtureUrl('prod', 'picker.html'));
  await page.getByTestId('danger').focus();
  await startPicking(context, page, serviceWorker);
  await resetStats(page);
  for (const key of ['Enter', 'Space', 'Tab', 'a', 'ArrowLeft']) await page.keyboard.press(key);
  expect(await stats(page)).toEqual(NONE);
});

test('Esc ends the pick and gives the focus back @REQ-PICK-003', async ({
  context,
  page,
  serviceWorker,
}) => {
  await page.goto(fixtureUrl('prod', 'picker.html'));
  await page.getByTestId('field').focus();
  await startPicking(context, page, serviceWorker);
  const { x, y } = await centerOf(page.getByTestId('danger'));
  await page.mouse.move(x, y);
  await expect(pickerPart(page, 'tooltip')).toContainText('button#danger.btn-danger');
  await page.keyboard.press('Escape');
  await expect(page.locator('sitemark-picker')).toHaveCount(0);
  expect(await page.evaluate(() => document.activeElement?.id)).toBe('field');
});
