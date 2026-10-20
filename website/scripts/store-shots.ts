// The store screenshots (D-251, T-152): the website's marked page and mark editor, plus a picker shot,
// a popup shot and production next to test, each framed on the kraft board with a caption →
// store/images/<locale>/N-name.png. Runs after screenshots.ts, which writes the website's PNGs it reads.
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { test } from '../../tests/e2e/fixtures';
import { centerOf, startPicking } from '../../tests/e2e/picker';
import { seedSiteGroup } from '../../tests/e2e/state';
import { screenshotFile } from '../src/content/screenshots';
import { type Locale, websiteLocales } from '../src/i18n/locales';
import {
  type Env,
  openPage,
  popupOverPage,
  popupPanel,
  SEEDS,
  seedMarks,
  serveDemoPage,
  settle,
  TEST_ORIGIN,
} from './scene';

const repository = path.resolve(import.meta.dirname, '../..');

type Caption = { headline: string; sub?: string };

/** What each store image says, in the listing's language (store/listing.md lists the same captions). */
const CAPTIONS: Record<
  Locale,
  Record<'marked' | 'versus' | 'picker' | 'popup' | 'options', Caption>
> = {
  en: {
    marked: { headline: 'Production, impossible to miss' },
    versus: { headline: 'Production and test, side by side' },
    picker: { headline: 'Pick the button that matters' },
    popup: { headline: 'Mark a site in one click', sub: 'Access is asked for one site at a time' },
    options: { headline: 'Fine-tune every mark with a live preview' },
  },
  nl: {
    marked: { headline: 'Productie, onmiskenbaar' },
    versus: { headline: 'Productie en test naast elkaar' },
    picker: { headline: 'Kies de knop die ertoe doet' },
    popup: { headline: 'Markeer een site met één klik', sub: 'Toegang wordt per site gevraagd' },
    options: { headline: 'Stel elke markering af met een voorbeeld' },
  },
};

const LABELS: Record<Locale, { production: string; test: string }> = {
  en: { production: 'Production', test: 'Test' },
  nl: { production: 'Productie', test: 'Test' },
};

const fontFace = (family: string, file: string) =>
  `@font-face{font-family:'${family}';src:url(data:font/woff2;base64,${readFileSync(
    path.join(repository, 'src/assets/fonts', file),
  ).toString('base64')})}`;
const FONTS = `${fontFace('Caveat Brush', 'caveat-brush-latin.woff2')}${fontFace('Patrick Hand', 'patrick-hand-latin.woff2')}`;

const png = (data: Buffer) => `data:image/png;base64,${data.toString('base64')}`;
const html = (text: string) => text.replace(/[&<>]/g, (c) => `&#${c.charCodeAt(0)};`);

/** The shared frame: kraft board, the caption on top and the content below it. */
function frame({ headline, sub }: Caption, content: string): string {
  return `<style>${FONTS}
html,body{margin:0}
body{width:1280px;height:800px;background:#c9a77c;position:relative;overflow:hidden;color:#33261b}
h1{margin:0;position:absolute;top:22px;left:0;right:0;text-align:center;font:400 58px/1.1 'Caveat Brush',sans-serif}
p{margin:0;position:absolute;top:92px;left:0;right:0;text-align:center;font:400 26px 'Patrick Hand',sans-serif}
.card{position:absolute;border:3px solid #33261b;border-radius:6px;box-shadow:6px 6px 0 #33261b;background:#fbf6e8;overflow:hidden}
.card img{display:block;width:100%}
.label{position:absolute;font:400 34px 'Caveat Brush',sans-serif;padding:2px 18px;border:3px solid #33261b;background:#f5cf5a;transform:rotate(-2deg)}
</style><h1>${html(headline)}</h1>${sub ? `<p>${html(sub)}</p>` : ''}${content}`;
}

/** One screenshot, big, under the caption. */
const single = (image: Buffer) =>
  `<div class="card" style="left:140px;top:150px;width:1000px"><img src="${png(image)}"></div>`;

/** Production and test next to each other, each with its label. */
function sideBySide(locale: Locale, production: Buffer, test: Buffer): string {
  const { production: left, test: right } = LABELS[locale];
  const card = (image: Buffer, x: number) =>
    `<div class="card" style="left:${x}px;top:250px;width:560px"><img src="${png(image)}"></div>`;
  const label = (text: string, x: number, color: string) =>
    `<div class="label" style="left:${x + 20}px;top:210px;background:${color}">${html(text)}</div>`;
  return `${card(production, 50)}${card(test, 670)}${label(left, 50, '#f4a3b5')}${label(right, 670, '#9bd6a8')}`;
}

async function framed(page: Page, caption: Caption, content: string, file: string): Promise<void> {
  await page.setContent(frame(caption, content));
  await page.waitForFunction(() => [...document.images].every((img) => img.complete));
  mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file });
}

const websiteShot = (scene: 'marked-page' | 'options', locale: Locale) =>
  readFileSync(
    path.join(repository, 'website/public', screenshotFile(scene, 'light', locale, 'png')),
  );

async function unmarkedPage({ context, theme }: Env): Promise<Buffer> {
  const page = await openPage(context, theme);
  await page.goto(`${TEST_ORIGIN}/?theme=${theme}`);
  return settle(page);
}

/** The picker over the shop, its outline on the Delete button. */
async function pickerShot({ context, worker, theme }: Env): Promise<Buffer> {
  const page = await openPage(context, theme);
  await page.goto(`${TEST_ORIGIN}/?theme=${theme}`);
  await startPicking(context, page, worker);
  const { x, y } = await centerOf(page.locator('#delete'));
  await page.mouse.move(x, y);
  await page.waitForTimeout(400);
  await page.mouse.move(x + 2, y + 1);
  return settle(page);
}

for (const locale of websiteLocales()) {
  test.describe(`store screenshots (${locale})`, () => {
    test.use({ uiLanguage: locale });

    test(`frames the five store images (${locale})`, async ({
      context,
      serviceWorker,
      extensionId,
    }) => {
      await serveDemoPage(context, locale);
      await seedSiteGroup(context, extensionId, {
        name: SEEDS[locale].name,
        patterns: ['*://prod.sitemark.test/*'],
        marks: seedMarks(locale),
      });
      const env: Env = { context, worker: serviceWorker, extensionId, theme: 'light' };
      const out = (name: string) => path.join(repository, 'store/images', locale, name);
      const board = await context.newPage();
      await board.setViewportSize({ width: 1280, height: 800 });
      const captions = CAPTIONS[locale];

      const production = websiteShot('marked-page', locale);
      await framed(board, captions.marked, single(production), out('1-marked-page.png'));
      const unmarked = await unmarkedPage(env);
      await framed(
        board,
        captions.versus,
        sideBySide(locale, production, unmarked),
        out('2-production-vs-test.png'),
      );
      await framed(board, captions.picker, single(await pickerShot(env)), out('3-picker.png'));
      const panel = await popupPanel(env, `${TEST_ORIGIN}/?theme=light`);
      await framed(
        board,
        captions.popup,
        single(await popupOverPage(env, unmarked, panel)),
        out('4-popup.png'),
      );
      await framed(
        board,
        captions.options,
        single(websiteShot('options', locale)),
        out('5-options.png'),
      );
    });
  });
}
