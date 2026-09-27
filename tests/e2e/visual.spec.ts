import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures';
import { fixtureUrl } from './hosts';
import { waitForMarker } from './marker';
import { seedSiteGroup } from './state';

const pageMark = {
  enabled: true,
  color: '#c93a2e',
  textColor: 'auto',
  target: { kind: 'page' },
  effects: {
    ribbon: { text: 'PROD', corner: 'top-right' },
    banner: { text: 'Production', edge: 'bottom', size: 'regular' },
    frame: { widthPx: 4 },
  },
};
const elementMark = {
  enabled: true,
  color: '#c93a2e',
  textColor: 'auto',
  target: { kind: 'element', selector: 'h1' },
  effects: { outline: { widthPx: 3, style: 'solid', pulse: false } },
};

/** White (the auto text color on red) at 60 %, as Chromium serializes it. */
const KEYLINE = /(rgba\(255, 255, 255, 0\.6\)|color\(srgb 1 1 1 \/ 0\.6\))/;

async function keylineOf(locator: Locator, pseudo?: string): Promise<string> {
  return locator.evaluate((el, which) => {
    const style = getComputedStyle(el, which ?? null);
    return `${style.boxShadow} | ${style.borderTopWidth} ${style.borderTopStyle} ${style.borderTopColor}`;
  }, pseudo);
}

test.beforeEach(async ({ context, extensionId }) => {
  await seedSiteGroup(context, extensionId, {
    patterns: ['*://prod.sitemark.test/*'],
    marks: [pageMark, elementMark],
  });
});

test('frames, outlines, ribbons and banners have a 1 px keyline in the text color at 60 % @REQ-RND-014', async ({
  context,
}) => {
  const page = await context.newPage();
  await page.goto(fixtureUrl('prod'));
  const root = await waitForMarker(page);
  await expect(root.locator('.sm-outline')).toBeVisible();
  const keylines: Record<string, string> = {};
  for (const [selector, pseudo] of [
    ['.sm-ribbon__band', undefined],
    ['.sm-banner', undefined],
    ['.sm-frame', undefined],
    ['.sm-outline', '::after'],
  ] as const) {
    keylines[selector] = await keylineOf(root.locator(selector), pseudo);
  }
  const keyline = expect.stringMatching(
    new RegExp(`1px.*${KEYLINE.source}|${KEYLINE.source}.*1px`),
  );
  expect(keylines).toEqual({
    '.sm-ribbon__band': keyline,
    '.sm-banner': keyline,
    '.sm-frame': keyline,
    '.sm-outline': keyline,
  });
});

test('marks keep their colors in forced-colors mode @REQ-A11Y-007', async ({ context }) => {
  const page = await context.newPage();
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto(fixtureUrl('prod'));
  const band = (await waitForMarker(page)).locator('.sm-ribbon__band');
  await expect(band).toHaveCSS('background-color', 'rgb(201, 58, 46)');
  await expect(band).toHaveCSS('forced-color-adjust', 'none');
});
