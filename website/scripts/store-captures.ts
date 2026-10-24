// The captures behind the store images (D-251, T-152): the extension marks a demo admin page on
// production, staging and test hosts, and each capture is taken at 2× with the boxes of the elements
// its callouts point at (store-slides.ts).
import type { Locator } from '@playwright/test';
import { waitForMarker } from '../../tests/e2e/marker';
import { centerOf, pickerPart, startPicking, waitForPanel } from '../../tests/e2e/picker';
import type { Locale } from '../src/i18n/locales';
import { type Env, ORIGIN, openPopupPanel, STAGING_ORIGIN, TEST_ORIGIN } from './scene';
import type { DemoLayout } from './screenshot-page';
import { PAGE_VIEWS, type Shot, type Shots, type Size } from './store-art';
import { open, type Say, say, sharpen, shoot } from './store-capture-tools';

/** A marked page: away from the ribbon and the banner, which fade when the pointer comes near. */
async function marked(env: Env, url: string, size: Size, layout: DemoLayout, targets = false) {
  const page = await open(env, url, env.theme, size, layout);
  const marker = await waitForMarker(page);
  await page.mouse.move(8, size.height / 2);
  if (!targets) return shoot(page);
  return shoot(page, {
    ribbon: marker.locator('.sm-ribbon__text'),
    banner: marker.locator('.sm-banner'),
    delete: page.locator('#delete'),
  });
}

/** The popup for `url` at 2×, down to its footer, and the page behind it. */
async function popup(env: Env, url: string, size: Size, layout: DemoLayout, button?: string) {
  const { theme } = env;
  const page = await shoot(await open(env, url, theme, size, layout));
  const panel = await openPopupPanel({ ...env, theme }, `${url}?theme=${theme}`);
  await sharpen(panel);
  const footer = await panel.locator('footer').boundingBox();
  const clip = { x: 0, y: 0, width: 360, height: footer?.y ?? 600 };
  const targets = button ? { button: panel.getByRole('button', { name: button }) } : {};
  return { page, panel: await shoot(panel, targets, clip) };
}

/** The picker on the Delete button, its panel beside it, the pointer resting on the panel. */
async function picker(env: Env, t: Say) {
  const page = await open(env, `${ORIGIN}/team/`, env.theme, PAGE_VIEWS.picker, 'customer');
  await waitForMarker(page);
  await startPicking(env.context, page, env.worker);
  const button = page.locator('#delete');
  const { x, y } = await centerOf(button);
  await page.mouse.move(x, y);
  await page.mouse.click(x, y);
  let panel = await waitForPanel(page);
  // Move panel cycles the corners clockwise: to the bottom right, below the hint bar and away
  // from the button.
  for (let i = 0; i < 4 && (await panel.getAttribute('data-corner')) !== 'bottom-right'; i++) {
    await panel.getByRole('button', { name: t('pickerMovePanel') }).click();
    panel = await waitForPanel(page);
  }
  // The selection label repeats what the panel says; hidden so the panel reads first.
  await pickerPart(page, 'tooltip').evaluate((label) => {
    (label as HTMLElement).style.visibility = 'hidden';
  });
  const save = panel.getByRole('button', { name: t('pickerSave') });
  const box = await save.boundingBox();
  if (box) await page.mouse.move(box.x - 60, box.y + 10);
  const [hint, target, card] = await Promise.all(
    [pickerPart(page, 'hint'), button, panel].map((l) => l.boundingBox()),
  );
  if (!target || !card) throw new Error('The picker has no panel or no button');
  // Cropped to the button and the panel, below the hint bar (it only matters while picking).
  const { width, height } = PAGE_VIEWS.picker;
  const below = hint ? hint.y + hint.height + 6 : 0;
  const top = Math.ceil(Math.max(below, Math.min(target.y, card.y) - 24));
  const left = Math.max(0, Math.floor(Math.min(target.x, card.x) - 32));
  const right = Math.min(
    width,
    Math.ceil(Math.max(target.x + target.width, card.x + card.width) + 24),
  );
  const bottom = Math.min(
    height,
    Math.ceil(Math.max(target.y + target.height, card.y + card.height) + 24),
  );
  return shoot(
    page,
    { save, delete: button },
    { x: left, y: top, width: right - left, height: bottom - top },
  );
}

/** The effects slide 5 shows, in the editor's order: four on, Tint off to show the switch. */
const EFFECT_ROWS = [
  'effectRibbon',
  'effectBanner',
  'effectFrame',
  'effectTint',
  'effectTitlePrefix',
] as const;

/**
 * The mark editor, cut into the rows slide 5 stacks: the colour presets, then one row per effect
 * switch (its name and On/Off), and the live preview. Each row is cropped by its locators.
 */
async function options(env: Env, route: string, t: Say) {
  const page = await open(
    env,
    `chrome-extension://${env.extensionId}/options.html${route}`,
    env.theme,
    { width: 1280, height: 1100 },
  );
  const figure = page.getByRole('figure');
  await figure.waitFor();
  const swatches = page
    .getByRole('radiogroup')
    .filter({ has: page.getByRole('radio', { name: t('colorRed') }) });
  const switches = EFFECT_ROWS.map((key) => page.getByRole('switch', { name: t(key) }));
  const rows = [swatches, ...switches.map((control) => control.locator('..'))];
  const boxes = await Promise.all(rows.map((row) => row.boundingBox()));
  if (boxes.some((box) => !box)) throw new Error('The mark editor is incomplete');
  // One width for every row, so they stack into one sheet.
  const left = Math.min(...boxes.map((box) => box?.x ?? 0)) - 16;
  const right = Math.max(...boxes.map((box) => (box ? box.x + box.width : 0))) + 16;
  const shots: Shot[] = [];
  for (const [i, row] of rows.entries()) {
    await row.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    const box = await row.boundingBox();
    if (!box) throw new Error('The mark editor is incomplete');
    // The colour row starts at its "Color" label, above the swatches.
    const top = Math.floor(i === 0 ? box.y - 34 : box.y - 8);
    const bottom = Math.ceil(box.y + box.height + 8);
    const targets: Record<string, Locator> =
      i === 0 ? { swatches } : { switch: switches[i - 1] as Locator };
    const crop = { x: left, y: top, width: right - left, height: bottom - top };
    shots.push(await shoot(page, targets, crop, false));
  }
  await figure.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const box = await figure.boundingBox();
  if (!box) throw new Error('The mark editor has no preview');
  const preview = await shoot(
    page,
    { figure },
    { x: box.x - 8, y: box.y - 8, width: box.width + 16, height: box.height + 16 },
  );
  return { rows: shots, preview };
}

/** Every capture the six slides need, in `env`'s theme and the given language. */
export async function captureStoreShots(env: Env, locale: Locale, route: string): Promise<Shots> {
  const t = say(locale);
  return {
    production: await marked(env, `${ORIGIN}/customers/`, PAGE_VIEWS.production, 'focus', true),
    environments: [
      await marked(env, `${ORIGIN}/orders/`, PAGE_VIEWS.environment, 'narrow'),
      await marked(env, `${STAGING_ORIGIN}/`, PAGE_VIEWS.environment, 'narrow'),
      await marked(env, `${TEST_ORIGIN}/orders/`, PAGE_VIEWS.environment, 'narrow'),
    ],
    popup: await popup(
      env,
      `${TEST_ORIGIN}/`,
      PAGE_VIEWS.popup,
      'customer',
      t('popupMarkThisSite'),
    ),
    picker: await picker(env, t),
    options: await options(env, route, t),
    privacy: await popup(env, `${STAGING_ORIGIN}/`, PAGE_VIEWS.privacy, 'narrow'),
  };
}
