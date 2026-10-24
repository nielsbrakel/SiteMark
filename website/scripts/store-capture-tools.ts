// Capturing for the store images (store-captures.ts): pages at 2× in the demo layouts, and shots
// that carry the boxes of their targets and of the page's own text.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Locator, Page } from '@playwright/test';
import type { ScreenshotTheme } from '../src/content/screenshots';
import type { Locale } from '../src/i18n/locales';
import { type Env, openPage } from './scene';
import type { DemoLayout } from './screenshot-page';
import type { Box, Shot, Size } from './store-art';

export const repository = path.resolve(import.meta.dirname, '../..');
export type Say = (key: string) => string;

/** The extension's own strings, to find its controls by name in either language. */
export function say(locale: Locale): Say {
  const file = path.join(repository, `public/_locales/${locale}/messages.json`);
  const all: Record<string, { message: string }> = JSON.parse(readFileSync(file, 'utf8'));
  return (key) => all[key]?.message ?? key;
}

/** Renders `page` at 2× from now on (the context itself is 1×). */
export async function sharpen(page: Page): Promise<void> {
  const size = page.viewportSize() ?? { width: 1280, height: 800 };
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    ...size,
    deviceScaleFactor: 2,
    mobile: false,
  });
}

export async function open(
  { context }: Env,
  url: string,
  theme: ScreenshotTheme,
  { width, height }: Size,
  layout: DemoLayout = 'full',
) {
  const page = await openPage(context, theme);
  await page.setViewportSize({ width, height });
  await sharpen(page);
  await page.goto(url.replace(/(#.*)?$/, `?theme=${theme}&layout=${layout}$1`));
  return page;
}

/** The demo page's text, which a note on the slide may not cover. */
const TEXT = 'header b, header span, h2, p, th, td, strong, button';

const inside = (box: Box, area: Box) =>
  box.width > 0 &&
  box.height > 0 &&
  box.x >= area.x &&
  box.y >= area.y &&
  box.x + box.width <= area.x + area.width &&
  box.y + box.height <= area.y + area.height;

const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/** Captures `clip` (the viewport by default) with the boxes of `targets`, which must lie inside it. */
export async function shoot(
  page: Page,
  targets: Record<string, Locator> = {},
  clip?: Box,
  close = true,
): Promise<Shot> {
  await page.waitForTimeout(500);
  const area = clip ?? { x: 0, y: 0, ...(page.viewportSize() ?? { width: 0, height: 0 }) };
  const boxes: Record<string, Box> = {};
  for (const [name, locator] of Object.entries(targets)) {
    const box = await locator.boundingBox();
    if (!box || !inside(box, area))
      throw new Error(`${name} is not inside the capture: ${JSON.stringify(box)}`);
    boxes[name] = { ...box, x: box.x - area.x, y: box.y - area.y };
  }
  const texts = (
    await page
      .locator(TEXT)
      .evaluateAll((all) =>
        all
          .filter((el) => getComputedStyle(el).visibility === 'visible')
          .map((el) => el.getBoundingClientRect().toJSON() as Box),
      )
  )
    .filter((box) => box.width > 0 && box.height > 0 && overlaps(box, area))
    .map((box) => ({ ...box, x: box.x - area.x, y: box.y - area.y }));
  const png = await page.screenshot({ clip: area });
  const url = new URL(page.url());
  const shot = {
    src: `data:image/png;base64,${png.toString('base64')}`,
    width: area.width,
    height: area.height,
    title: await page.title(),
    host: url.protocol === 'chrome-extension:' ? 'SiteMark' : url.host,
    boxes,
    texts,
  };
  if (close) await page.close();
  return shot;
}
