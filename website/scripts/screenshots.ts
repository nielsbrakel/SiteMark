// The screenshot generator (D-251, T-230): the real e2e build of the extension marks a demo page, in
// light and dark and in English and Dutch → website/public/screenshots. The PNGs are the store
// images (T-152), the WebPs are what the website shows. Run it with `pnpm web:screenshots`.
import { test } from '../../tests/e2e/fixtures';
import { waitForMarker } from '../../tests/e2e/marker';
import { seedSiteGroup } from '../../tests/e2e/state';
import {
  type ScreenshotScene,
  screenshotFile,
  screenshotScenes,
  screenshotThemes,
} from '../src/content/screenshots';
import { websiteLocales } from '../src/i18n/locales';
import { toWebp, writePublic } from './image-files';
import {
  type Env,
  ORIGIN,
  openPage,
  popupOverPage,
  popupPanel,
  SEEDS,
  seedMarks,
  serveDemoPage,
  settle,
} from './scene';

type Scene = Env & {
  /** The options route of the seeded page mark, e.g. `#/groups/<id>/marks/<id>`. */
  markRoute: string;
};

async function markedPage({ context, theme }: Scene): Promise<Buffer> {
  const page = await openPage(context, theme);
  await page.goto(`${ORIGIN}/?theme=${theme}`);
  await waitForMarker(page);
  // Away from the ribbon and the banner, which fade when the pointer comes near.
  await page.mouse.move(640, 400);
  return settle(page);
}

/** The popup over the marked page. */
async function popup(scene: Scene): Promise<Buffer> {
  const panel = await popupPanel(scene, `${ORIGIN}/?theme=${scene.theme}`);
  return popupOverPage(scene, await markedPage(scene), panel);
}

/** The mark editor with its live preview. */
async function options({ context, theme, extensionId, markRoute }: Scene): Promise<Buffer> {
  const page = await openPage(context, theme);
  await page.goto(`chrome-extension://${extensionId}/options.html${markRoute}`);
  const preview = page.getByRole('figure');
  await preview.evaluate((figure) => figure.scrollIntoView({ block: 'center' }));
  return settle(page);
}

function capture(scene: ScreenshotScene, env: Scene): Promise<Buffer> {
  switch (scene) {
    case 'marked-page':
      return markedPage(env);
    case 'popup':
      return popup(env);
    case 'options':
      return options(env);
  }
}

for (const locale of websiteLocales()) {
  test.describe(`screenshots (${locale})`, () => {
    test.use({ uiLanguage: locale });

    test(`captures every scene in light and dark (${locale})`, async ({
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
      for (const theme of screenshotThemes()) {
        const env = { context, worker: serviceWorker, extensionId, theme, markRoute };
        for (const scene of screenshotScenes()) {
          const png = await capture(scene, env);
          writePublic(screenshotFile(scene, theme, locale, 'png'), png);
          writePublic(screenshotFile(scene, theme, locale, 'webp'), await toWebp(context, png));
        }
      }
    });
  });
}
