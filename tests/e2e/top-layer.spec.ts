import { expect, test } from './fixtures';
import { fixtureUrl } from './hosts';
import { waitForMarker } from './marker';
import { pixelAt } from './pixels';
import { aRibbonMark, seedSiteGroup } from './state';

const RED = [0xc9, 0x3a, 0x2e];

test.beforeEach(async ({ context, extensionId }) => {
  await seedSiteGroup(context, extensionId, {
    patterns: ['*://prod.sitemark.test/*'],
    marks: [aRibbonMark('PROD')],
  });
});

/** A point on the ribbon band, clear of its text: 45 px in from the top-right corner, then along the band. */
async function onRibbon(page: import('@playwright/test').Page) {
  const width = await page.evaluate(() => innerWidth);
  return { x: width - 20, y: 70 };
}

test('the ribbon stays above a modal dialog and its backdrop @REQ-RND-006', async ({ context }) => {
  const page = await context.newPage();
  await page.goto(fixtureUrl('prod', 'dialog.html'));
  await page.bringToFront();
  await waitForMarker(page);
  const point = await onRibbon(page);
  await expect.poll(() => pixelAt(page, point.x, point.y)).toEqual(RED);
  await page.getByRole('button', { name: 'Open dialog' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect.poll(() => pixelAt(page, point.x, point.y)).toEqual(RED);
});

test('the ribbon stays above a page popover opened later @REQ-RND-006', async ({ context }) => {
  const page = await context.newPage();
  await page.goto(fixtureUrl('prod', 'dialog.html'));
  await page.bringToFront();
  await waitForMarker(page);
  await page.evaluate(() => {
    const cover = document.getElementById('page-popover') as HTMLElement;
    for (const [name, value] of Object.entries({
      inset: '0',
      width: '100vw',
      height: '100vh',
      margin: '0',
      background: '#000',
    })) {
      cover.style.setProperty(name, value);
    }
    cover.showPopover();
  });
  const point = await onRibbon(page);
  await expect.poll(() => pixelAt(page, point.x, point.y)).toEqual(RED);
});

test('the ribbon stays visible over a fullscreen element @REQ-RND-006', async ({ context }) => {
  const page = await context.newPage();
  await page.goto(fixtureUrl('prod', 'fullscreen.html'));
  await page.bringToFront();
  await waitForMarker(page);
  await page.getByRole('button', { name: 'Enter fullscreen' }).click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement !== null)).toBe(true);
  const point = await onRibbon(page);
  await expect.poll(() => pixelAt(page, point.x, point.y)).toEqual(RED);
});
