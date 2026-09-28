// The screenshot generator (D-251, T-230): the real e2e build of the extension marks a demo page, in
// light and dark and in English and Dutch → website/public/screenshots. The PNGs are the store
// images (T-152), the WebPs are what the website shows. Run it with `pnpm web:screenshots`.
import type { BrowserContext, Page, Worker } from '@playwright/test';
import { test } from '../../tests/e2e/fixtures';
import { waitForMarker } from '../../tests/e2e/marker';
import { openPopupFor } from '../../tests/e2e/popup-page';
import { seedSiteGroup } from '../../tests/e2e/state';
import {
  SCREENSHOT_SIZE,
  type ScreenshotScene,
  type ScreenshotTheme,
  screenshotFile,
  screenshotScenes,
  screenshotThemes,
} from '../src/content/screenshots';
import { type Locale, websiteLocales } from '../src/i18n/locales';
import { toWebp, writePublic } from './image-files';
import { screenshotPage } from './screenshot-page';

/** A pre-granted origin of the e2e build, on the default port. */
const ORIGIN = 'http://prod.sitemark.test';

/** The marks the screenshots show, in the screenshot's language. */
const SEEDS: Record<Locale, { name: string; banner: string; button: string }> = {
  en: { name: 'Production', banner: 'Production: changes are live', button: 'Delete button' },
  nl: { name: 'Productie', banner: 'Productie: wijzigingen zijn live', button: 'Verwijderknop' },
};

function seedMarks(locale: Locale) {
  const { banner, button } = SEEDS[locale];
  const base = { enabled: true, color: '#c93a2e', textColor: 'auto' };
  return [
    {
      ...base,
      target: { kind: 'page' },
      effects: {
        ribbon: { text: 'PROD', corner: 'top-right' },
        banner: { text: banner, edge: 'bottom', size: 'regular' },
        frame: { widthPx: 4 },
        titlePrefix: { text: 'PROD' },
      },
    },
    {
      ...base,
      label: button,
      target: { kind: 'element', selector: '#delete' },
      effects: { outline: { widthPx: 3, style: 'solid', pulse: false } },
    },
  ];
}

type Scene = {
  context: BrowserContext;
  worker: Worker;
  extensionId: string;
  theme: ScreenshotTheme;
  /** The options route of the seeded page mark, e.g. `#/groups/<id>/marks/<id>`. */
  markRoute: string;
};

/** Serves the demo page on the pre-granted origin (`?theme=dark` for the dark variant). */
async function serveDemoPage(context: BrowserContext, locale: Locale): Promise<void> {
  await context.route(`${ORIGIN}/**`, (route) => {
    const theme = new URL(route.request().url()).searchParams.get('theme');
    const body = screenshotPage(locale, theme === 'dark' ? 'dark' : 'light');
    return route.fulfill({ contentType: 'text/html; charset=utf-8', body });
  });
}

async function openPage(context: BrowserContext, theme: ScreenshotTheme): Promise<Page> {
  const page = await context.newPage();
  await page.setViewportSize(SCREENSHOT_SIZE);
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  return page;
}

async function settle(page: Page): Promise<Buffer> {
  await page.waitForTimeout(500);
  const png = await page.screenshot();
  await page.close();
  return png;
}

async function markedPage({ context, theme }: Scene): Promise<Buffer> {
  const page = await openPage(context, theme);
  await page.goto(`${ORIGIN}/?theme=${theme}`);
  await waitForMarker(page);
  // Away from the ribbon and the banner, which fade when the pointer comes near.
  await page.mouse.move(640, 400);
  return settle(page);
}

/** The popup for the marked page, as a panel as tall as its content. */
async function popupPanel({ context, worker, extensionId, theme }: Scene): Promise<Buffer> {
  const { site, popup } = await openPopupFor(
    context,
    worker,
    extensionId,
    `${ORIGIN}/?theme=${theme}`,
  );
  await popup.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  await popup.setViewportSize({ width: 360, height: 600 });
  await popup.getByRole('list').first().waitFor();
  const height = await popup.evaluate(() => document.body.scrollHeight);
  await popup.setViewportSize({ width: 360, height: Math.min(height, 600) });
  await site.close();
  return settle(popup);
}

/** Draws the popup panel over the page screenshot, below the toolbar like the browser does. */
async function popup(scene: Scene): Promise<Buffer> {
  const background = await markedPage(scene);
  const panel = await popupPanel(scene);
  const page = await openPage(scene.context, scene.theme);
  const url = (png: Buffer) => `data:image/png;base64,${png.toString('base64')}`;
  await page.setContent(
    `<body style="margin:0"><img src="${url(background)}" style="display:block">` +
      `<img src="${url(panel)}" style="position:absolute;top:8px;right:200px;border-radius:8px;` +
      'box-shadow:0 8px 32px rgb(0 0 0/.35),0 0 0 1px rgb(0 0 0/.2)"></body>',
  );
  await page.waitForFunction(() => [...document.images].every((img) => img.complete));
  return settle(page);
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
