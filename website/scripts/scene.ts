// The scene of the store screenshots (D-251): the demo page the e2e build marks, served on its
// pre-granted origins, and the popup as a panel as tall as its content.
import type { BrowserContext, Page, Worker } from '@playwright/test';
import { openPopupFor } from '../../tests/e2e/popup-page';
import { SCREENSHOT_SIZE, type ScreenshotTheme } from '../src/content/screenshots';
import type { Locale } from '../src/i18n/locales';
import { type DemoLayout, screenshotPage } from './screenshot-page';

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

const LAYOUTS: readonly DemoLayout[] = ['full', 'focus', 'customer', 'narrow'];
const layoutOf = (value: string | null) =>
  LAYOUTS.find((layout) => layout === value) ?? ('full' as const);

/** Serves the demo page on every origin (`?theme=dark` for the dark variant, `&layout=` its layout). */
export async function serveDemoPage(context: BrowserContext, locale: Locale): Promise<void> {
  for (const origin of [ORIGIN, STAGING_ORIGIN, TEST_ORIGIN]) {
    await context.route(`${origin}/**`, (route) => {
      const params = new URL(route.request().url()).searchParams;
      const theme = params.get('theme') === 'dark' ? 'dark' : 'light';
      const body = screenshotPage(locale, theme, layoutOf(params.get('layout')));
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

/** The marks the screenshots show, in the screenshot's language. */
export const SEEDS: Record<Locale, { name: string; banner: string; button: string }> = {
  en: { name: 'Production', banner: 'Production: changes are live', button: 'Delete button' },
  nl: { name: 'Productie', banner: 'Productie: wijzigingen zijn live', button: 'Verwijderknop' },
};
