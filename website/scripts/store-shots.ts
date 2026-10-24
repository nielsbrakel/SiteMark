// The store screenshots (D-251, T-152): the captures (store-captures.ts) composed into 1280 × 800
// slides (store-slides.ts) → store/images/<locale>/N-name.png. A note may never cover a target.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { BrowserContext, Page } from '@playwright/test';
import { test } from '../../tests/e2e/fixtures';
import { type MarkSeed, seedSiteGroup } from '../../tests/e2e/state';
import { type Locale, websiteLocales } from '../src/i18n/locales';
import { SEEDS, serveDemoPage } from './scene';
import { type Box, MARK } from './store-art';
import { captureStoreShots, repository } from './store-captures';
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

async function render(board: Page, slide: Slide, dir: string): Promise<void> {
  await board.setContent(slide.html);
  await board.waitForFunction(() => [...document.images].every((img) => img.complete));
  const notes = await board
    .locator('.note')
    .evaluateAll((all) => all.map((note) => note.getBoundingClientRect().toJSON() as Box));
  const hit = notes.find((note) => slide.targets.some((target) => overlap(note, target)));
  if (hit) throw new Error(`${slide.file}: a note covers a target at ${JSON.stringify(hit)}`);
  writeFileSync(path.join(dir, `${slide.file}.png`), await board.screenshot());
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
      const env = { context, worker: serviceWorker, extensionId, theme: 'light' as const };
      const shots = await captureStoreShots(env, locale, route);
      const board = await context.newPage();
      await board.setViewportSize({ width: 1280, height: 800 });
      const dir = path.join(repository, 'store/images', locale);
      mkdirSync(dir, { recursive: true });
      for (const slide of slides(locale, shots)) await render(board, slide, dir);
    });
  });
}
