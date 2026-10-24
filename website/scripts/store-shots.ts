// The store screenshots (D-251, T-152): the extension marks a demo shop, and each capture is composed into a
// 1280 × 800 slide on the kraft board (store-slides.ts) → store/images/<locale>/N-name.png.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test } from '../../tests/e2e/fixtures';
import { waitForMarker } from '../../tests/e2e/marker';
import { centerOf, startPicking } from '../../tests/e2e/picker';
import { seedSiteGroup } from '../../tests/e2e/state';
import { websiteLocales } from '../src/i18n/locales';
import {
  type Env,
  ORIGIN,
  openPage,
  popupPanel,
  SEEDS,
  seedMarks,
  serveDemoPage,
  settle,
  TEST_ORIGIN,
} from './scene';
import { type Shots, slides } from './store-slides';

const repository = path.resolve(import.meta.dirname, '../..');
const png = (data: Buffer) => `data:image/png;base64,${data.toString('base64')}`;

async function markedPage({ context, theme }: Env): Promise<Buffer> {
  const page = await openPage(context, theme);
  await page.goto(`${ORIGIN}/?theme=${theme}`);
  await waitForMarker(page);
  // Away from the ribbon and the banner, which fade when the pointer comes near.
  await page.mouse.move(640, 400);
  return settle(page);
}

/** The mark editor with its live preview. */
async function optionsPage(
  { context, theme, extensionId }: Env,
  markRoute: string,
): Promise<Buffer> {
  const page = await openPage(context, theme);
  await page.goto(`chrome-extension://${extensionId}/options.html${markRoute}`);
  await page.getByRole('figure').evaluate((figure) => figure.scrollIntoView({ block: 'center' }));
  return settle(page);
}

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

    test(`composes the six store images (${locale})`, async ({
      context,
      serviceWorker,
      extensionId,
    }) => {
      await serveDemoPage(context, locale);
      const state = await seedSiteGroup(context, extensionId, {
        name: SEEDS[locale].name,
        patterns: ['*://prod.sitemark.test/*'],
        marks: seedMarks(locale),
      });
      const group = state.siteGroups.at(-1);
      const markRoute = `#/groups/${group?.id}/marks/${group?.marks[0]?.id}`;
      const env: Env = { context, worker: serviceWorker, extensionId, theme: 'light' };
      const shots: Shots = {
        marked: png(await markedPage(env)),
        unmarked: png(await unmarkedPage(env)),
        picker: png(await pickerShot(env)),
        popup: png(await popupPanel(env, `${ORIGIN}/?theme=light`)),
        options: png(await optionsPage(env, markRoute)),
      };
      const board = await context.newPage();
      await board.setViewportSize({ width: 1280, height: 800 });
      const dir = path.join(repository, 'store/images', locale);
      mkdirSync(dir, { recursive: true });
      for (const slide of slides(locale, shots)) {
        await board.setContent(slide.html);
        await board.waitForFunction(() => [...document.images].every((img) => img.complete));
        writeFileSync(path.join(dir, `${slide.file}.png`), await board.screenshot());
      }
    });
  });
}
