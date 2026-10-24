// The captures behind the store images (D-251, T-152): the extension marks a demo admin page on
// production, staging and test hosts, and each capture is taken at 2× with the boxes of the elements
// its callouts point at (store-slides.ts).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Locator, Page } from '@playwright/test';
import { waitForMarker } from '../../tests/e2e/marker';
import { centerOf, pickerPart, startPicking, waitForPanel } from '../../tests/e2e/picker';
import type { ScreenshotTheme } from '../src/content/screenshots';
import type { Locale } from '../src/i18n/locales';
import { type Env, ORIGIN, openPage, openPopupPanel, STAGING_ORIGIN, TEST_ORIGIN } from './scene';
import type { Box, Shot, Shots } from './store-art';

export const repository = path.resolve(import.meta.dirname, '../..');
type Say = (key: string) => string;

/** The extension's own strings, to find its controls by name in either language. */
function say(locale: Locale): Say {
  const file = path.join(repository, `public/_locales/${locale}/messages.json`);
  const all: Record<string, { message: string }> = JSON.parse(readFileSync(file, 'utf8'));
  return (key) => all[key]?.message ?? key;
}

/** Renders `page` at 2× from now on (the context itself is 1×). */
async function sharpen(page: Page): Promise<void> {
  const size = page.viewportSize() ?? { width: 1280, height: 800 };
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    ...size,
    deviceScaleFactor: 2,
    mobile: false,
  });
}

async function open(
  { context }: Env,
  url: string,
  theme: ScreenshotTheme,
  width: number,
  height: number,
) {
  const page = await openPage(context, theme);
  await page.setViewportSize({ width, height });
  await sharpen(page);
  await page.goto(url.replace(/(#.*)?$/, `?theme=${theme}$1`));
  return page;
}

const inside = (box: Box, area: Box) =>
  box.width > 0 &&
  box.height > 0 &&
  box.x >= area.x &&
  box.y >= area.y &&
  box.x + box.width <= area.x + area.width &&
  box.y + box.height <= area.y + area.height;

/** Captures `clip` (the viewport by default) with the boxes of `targets`, which must lie inside it. */
async function shoot(
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
  const png = await page.screenshot({ clip: area });
  const url = new URL(page.url());
  const shot = {
    src: `data:image/png;base64,${png.toString('base64')}`,
    width: area.width,
    height: area.height,
    title: await page.title(),
    host: url.protocol === 'chrome-extension:' ? 'SiteMark' : url.host,
    boxes,
  };
  if (close) await page.close();
  return shot;
}

/** A marked page: away from the ribbon and the banner, which fade when the pointer comes near. */
async function marked(
  env: Env,
  url: string,
  theme: ScreenshotTheme,
  height: number,
  targets = false,
) {
  const page = await open(env, url, theme, 1280, height);
  const marker = await waitForMarker(page);
  await page.mouse.move(900, 340);
  if (!targets) return shoot(page);
  return shoot(page, {
    ribbon: marker.locator('.sm-ribbon__text'),
    banner: marker.locator('.sm-banner'),
    delete: page.locator('#delete'),
  });
}

/** The popup for `url` at 2×, down to its footer, and the page behind it. */
async function popup(
  env: Env,
  url: string,
  theme: ScreenshotTheme,
  height: number,
  button?: string,
) {
  const page = await shoot(await open(env, url, theme, 1280, height));
  const panel = await openPopupPanel({ ...env, theme }, `${url}?theme=${theme}`);
  await sharpen(panel);
  const footer = await panel.locator('footer').boundingBox();
  const clip = { x: 0, y: 0, width: 360, height: footer?.y ?? 600 };
  const targets = button ? { button: panel.getByRole('button', { name: button }) } : {};
  return { page, panel: await shoot(panel, targets, clip) };
}

/** The picker on the Delete button, its panel moved to the bottom right, the pointer resting on it. */
async function picker(env: Env, t: Say) {
  const page = await open(env, `${ORIGIN}/team/`, env.theme, 760, 600);
  await waitForMarker(page);
  await startPicking(env.context, page, env.worker);
  const { x, y } = await centerOf(page.locator('#delete'));
  await page.mouse.move(x, y);
  await page.mouse.click(x, y);
  const panel = await waitForPanel(page);
  await panel.getByRole('button', { name: t('pickerMovePanel') }).click();
  await waitForPanel(page);
  // The selection label repeats what the panel says; hidden so the panel reads first.
  await pickerPart(page, 'tooltip').evaluate((label) => {
    (label as HTMLElement).style.visibility = 'hidden';
  });
  const save = panel.getByRole('button', { name: t('pickerSave') });
  const box = await save.boundingBox();
  if (box) await page.mouse.move(box.x - 60, box.y + 10);
  // Below the hint bar, which only matters while picking.
  const hint = (await pickerPart(page, 'hint').boundingBox()) ?? { y: 0, height: 42 };
  const top = Math.ceil(hint.y + hint.height + 6);
  return shoot(
    page,
    { save, delete: page.locator('#delete') },
    { x: 0, y: top, width: 760, height: 600 - top },
  );
}

/** The mark editor: the colour and ribbon rows, and the live preview, each cropped by its locators. */
async function options(env: Env, route: string, t: Say) {
  const page = await open(
    env,
    `chrome-extension://${env.extensionId}/options.html${route}`,
    env.theme,
    1280,
    1100,
  );
  const figure = page.getByRole('figure');
  const swatches = page
    .getByRole('radiogroup')
    .filter({ has: page.getByRole('radio', { name: t('colorRed') }) });
  const ribbonText = page.getByLabel(t('optionsRibbonText'), { exact: true });
  await figure.waitFor();
  const [f, s, r] = await Promise.all([figure, swatches, ribbonText].map((l) => l.boundingBox()));
  if (!f || !s || !r) throw new Error('The mark editor is incomplete');
  await page.evaluate((top) => window.scrollTo(0, top), s.y - 60);
  const [fig, sw, rt] = await Promise.all(
    [figure, swatches, ribbonText].map((l) => l.boundingBox()),
  );
  if (!fig || !sw || !rt) throw new Error('The mark editor is incomplete');
  const form = {
    x: fig.x - 12,
    y: sw.y - 36,
    width: fig.width + 24,
    height: rt.y + rt.height + 12 - (sw.y - 36),
  };
  const formShot = await shoot(page, { swatches }, form, false);
  await figure.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const box = (await figure.boundingBox()) ?? fig;
  const preview = await shoot(
    page,
    { figure },
    { x: box.x - 8, y: box.y - 8, width: box.width + 16, height: box.height + 16 },
  );
  return { form: formShot, preview };
}

/** Every capture the six slides need, in `env`'s theme and the given language. */
export async function captureStoreShots(env: Env, locale: Locale, route: string): Promise<Shots> {
  const t = say(locale);
  return {
    production: await marked(env, `${ORIGIN}/customers/`, env.theme, 600, true),
    environments: [
      await marked(env, `${ORIGIN}/orders/`, env.theme, 800),
      await marked(env, `${STAGING_ORIGIN}/`, env.theme, 800),
      await marked(env, `${TEST_ORIGIN}/orders/`, env.theme, 800),
    ],
    popup: await popup(env, `${TEST_ORIGIN}/`, env.theme, 600, t('popupMarkThisSite')),
    picker: await picker(env, t),
    options: await options(env, route, t),
    privacy: await popup(env, `${STAGING_ORIGIN}/`, env.theme, 930),
  };
}
