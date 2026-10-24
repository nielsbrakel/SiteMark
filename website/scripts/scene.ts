// What the screenshot generators share (D-251): the demo page the e2e build marks, served on its
// pre-granted origins, and the popup drawn over a page like the browser does.
import type { BrowserContext, Page, Worker } from '@playwright/test';
import { openPopupFor } from '../../tests/e2e/popup-page';
import { SCREENSHOT_SIZE, type ScreenshotTheme } from '../src/content/screenshots';
import type { Locale } from '../src/i18n/locales';
import { screenshotPage } from './screenshot-page';

/** Pre-granted origins of the e2e build (example.com is reserved): production, staging and test. */
export const ORIGIN = 'https://app.example.com';
export const STAGING_ORIGIN = 'https://staging.example.com';
export const TEST_ORIGIN = 'https://test.example.com';

export type Env = {
  context: BrowserContext;
  worker: Worker;
  extensionId: string;
  theme: ScreenshotTheme;
};

/** Serves the demo page on every origin (`?theme=dark` for the dark variant). */
export async function serveDemoPage(context: BrowserContext, locale: Locale): Promise<void> {
  for (const origin of [ORIGIN, STAGING_ORIGIN, TEST_ORIGIN]) {
    await context.route(`${origin}/**`, (route) => {
      const theme = new URL(route.request().url()).searchParams.get('theme');
      const body = screenshotPage(locale, theme === 'dark' ? 'dark' : 'light');
      return route.fulfill({ contentType: 'text/html; charset=utf-8', body });
    });
  }
}

export async function openPage(context: BrowserContext, theme: ScreenshotTheme): Promise<Page> {
  const page = await context.newPage();
  await page.setViewportSize(SCREENSHOT_SIZE);
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  return page;
}

export async function settle(page: Page): Promise<Buffer> {
  await page.waitForTimeout(500);
  const png = await page.screenshot();
  await page.close();
  return png;
}

/** The popup for the tab showing `url`, sized as a panel as tall as its content. */
export async function openPopupPanel(
  { context, worker, extensionId, theme }: Env,
  url: string,
): Promise<Page> {
  const { site, popup } = await openPopupFor(context, worker, extensionId, url);
  await popup.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  await popup.setViewportSize({ width: 360, height: 600 });
  await popup
    .getByRole('list')
    .or(popup.getByRole('button', { name: /^(Mark this site|Deze site markeren)$/ }))
    .first()
    .waitFor();
  // The footer comes last: wait for it, so the panel is measured at its full height.
  await popup.getByRole('link', { name: 'GitHub' }).waitFor();
  const height = await popup.evaluate(() => document.body.scrollHeight);
  await popup.setViewportSize({ width: 360, height: Math.min(height, 600) });
  await site.close();
  return popup;
}

export const popupPanel = async (env: Env, url: string) => settle(await openPopupPanel(env, url));

/** Draws the popup panel over the page screenshot, below the toolbar like the browser does. */
export async function popupOverPage(
  { context, theme }: Env,
  background: Buffer,
  panel: Buffer,
): Promise<Buffer> {
  const page = await openPage(context, theme);
  const url = (png: Buffer) => `data:image/png;base64,${png.toString('base64')}`;
  await page.setContent(
    `<body style="margin:0"><img src="${url(background)}" style="display:block">` +
      `<img src="${url(panel)}" style="position:absolute;top:8px;right:200px;border-radius:8px;` +
      'box-shadow:0 8px 32px rgb(0 0 0/.35),0 0 0 1px rgb(0 0 0/.2)"></body>',
  );
  await page.waitForFunction(() => [...document.images].every((img) => img.complete));
  return settle(page);
}

/** The marks the screenshots show, in the screenshot's language. */
export const SEEDS: Record<Locale, { name: string; banner: string; button: string }> = {
  en: { name: 'Production', banner: 'Production: changes are live', button: 'Delete button' },
  nl: { name: 'Productie', banner: 'Productie: wijzigingen zijn live', button: 'Verwijderknop' },
};

export function seedMarks(locale: Locale) {
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
