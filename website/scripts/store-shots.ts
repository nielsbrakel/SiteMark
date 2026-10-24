// The store screenshots (D-251, T-152): the captures (store-captures.ts) composed into 1280 × 800
// slides (store-slides.ts) → store/images/<locale>/N-name.png. A note may never cover a target.
// The light set is also written at 2× (2560 × 1600) for the Mac App Store → <locale>/appstore/.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { type BrowserContext, chromium, type Page } from '@playwright/test';
import { test } from '../../tests/e2e/fixtures';
import { type MarkSeed, seedSiteGroup } from '../../tests/e2e/state';
import { screenshotThemes } from '../src/content/screenshots';
import { type Locale, websiteLocales } from '../src/i18n/locales';
import { SEEDS, serveDemoPage } from './scene';
import { type Box, MARK } from './store-art';
import { repository } from './store-capture-tools';
import { captureStoreShots } from './store-captures';
import type { Slide } from './store-slides';
import { slides } from './store-slides';

const pageMark = (color: string, text: string, effects: Record<string, unknown>) => ({
  enabled: true,
  color,
  textColor: 'auto',
  target: { kind: 'page' },
  effects: { ribbon: { text, corner: 'top-right' }, titlePrefix: { text }, ...effects },
});

/** Seeds the site groups the slides show; resolves with the options route of the production page mark. */
async function seedStoreGroups(
  context: BrowserContext,
  extensionId: string,
  locale: Locale,
): Promise<string> {
  const { name, banner, button } = SEEDS[locale];
  const prod = (edge: string) =>
    pageMark(MARK.red, 'PROD', {
      banner: { text: banner, edge, size: 'regular' },
      frame: { widthPx: 4 },
    });
  const seed = (group: string, pattern: string, marks: MarkSeed[]) =>
    seedSiteGroup(context, extensionId, { name: group, patterns: [pattern], marks });
  const outline = {
    enabled: true,
    color: MARK.red,
    textColor: 'auto',
    label: button,
    target: { kind: 'element', selector: '#delete' },
    effects: { outline: { widthPx: 3, style: 'solid', pulse: false } },
  };
  // The page paths keep the variants apart: the address bar only shows the host.
  const group = (
    await seed(name, '*://app.example.com/customers/*', [prod('bottom'), outline])
  ).siteGroups.at(-1);
  await seed(name, '*://app.example.com/orders/*', [prod('top')]);
  await seed(name, '*://app.example.com/team/*', [
    pageMark(MARK.red, 'PROD', { frame: { widthPx: 4 } }),
  ]);
  const staging = { banner: { text: 'Staging', edge: 'top', size: 'compact' } };
  await seed('Staging', '*://staging.example.com/*', [pageMark(MARK.amber, 'STAGING', staging)]);
  await seed('Test', '*://test.example.com/orders/*', [
    pageMark(MARK.blue, 'TEST', { frame: { widthPx: 4 } }),
  ]);
  return `#/groups/${group?.id}/marks/${group?.marks[0]?.id}`;
}

const overlap = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/** The note boxes on the board, in the order the notes were added. */
async function noteBoxes(board: Page): Promise<Box[]> {
  return board
    .locator('.note')
    .evaluateAll((all) => all.map((note) => note.getBoundingClientRect().toJSON() as Box));
}

/** Where `box` lies on a slide it must not: off the slide, or over a target, page text or note. */
function clash(box: Box, slide: Slide, others: Box[]): string | undefined {
  const off = box.x < 8 || box.y < 8 || box.x + box.width > 1272 || box.y + box.height > 792;
  if (off) return 'off the slide';
  if (slide.targets.some((target) => overlap(box, target))) return 'over a target';
  if (slide.avoid.some((text) => overlap(box, text))) return 'over page text';
  if (others.some((other) => overlap(box, other))) return 'over another note';
  return undefined;
}

/** Each note at the first of its places that clashes with nothing, then the slide as a PNG. */
async function render(board: Page, slide: Slide, dir: string): Promise<void> {
  let chosen = '';
  for (const [i, places] of slide.notes.entries()) {
    const reasons: string[] = [];
    const fit = await (async () => {
      for (const note of places) {
        await board.setContent(slide.html + chosen + note);
        await board.evaluate(() => document.fonts.ready.then(() => undefined));
        const boxes = await noteBoxes(board);
        const box = boxes.at(-1) as Box;
        const reason = clash(box, slide, boxes.slice(0, -1));
        if (!reason) return note;
        reasons.push(reason);
      }
      return undefined;
    })();
    if (!fit) throw new Error(`${slide.file}: note ${i + 1} fits nowhere (${reasons.join(', ')})`);
    chosen += fit;
  }
  await board.setContent(slide.html + chosen);
  await board.waitForFunction(() => [...document.images].every((img) => img.complete));
  writeFileSync(path.join(dir, `${slide.file}.png`), await board.screenshot());
}

/**
 * The Mac App Store takes 16:10 screenshots up to 2880 × 1800: the same slides at 2×, composed in a
 * plain Chromium (the slides are self-contained HTML) whose pages render at device scale 2.
 */
async function renderAppStore(set: Slide[], locale: Locale) {
  const executablePath = process.env.PW_CHROMIUM_EXECUTABLE;
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const board = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const dir = path.join(repository, 'store/images', locale, 'appstore');
  mkdirSync(dir, { recursive: true });
  for (const slide of set) await render(board, slide, dir);
  await browser.close();
}

for (const locale of websiteLocales()) {
  test.describe(`store screenshots (${locale})`, () => {
    test.use({ uiLanguage: locale });

    test(`composes the six store images (${locale})`, async ({
      context,
      serviceWorker,
      extensionId,
    }) => {
      await serveDemoPage(context, locale);
      const route = await seedStoreGroups(context, extensionId, locale);
      for (const theme of screenshotThemes()) {
        const env = { context, worker: serviceWorker, extensionId, theme };
        const shots = await captureStoreShots(env, locale, route);
        const board = await context.newPage();
        await board.setViewportSize({ width: 1280, height: 800 });
        // Light is the default set; dark is the alternative set in its own folder.
        const dir = path.join(repository, 'store/images', locale, theme === 'dark' ? 'dark' : '');
        mkdirSync(dir, { recursive: true });
        const set = slides(locale, shots, theme);
        for (const slide of set) await render(board, slide, dir);
        await board.close();
        if (theme === 'light') await renderAppStore(set, locale);
      }
    });
  });
}
