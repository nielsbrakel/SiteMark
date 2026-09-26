import { test as base, expect, type Page } from '@playwright/test';
import type { Locale } from '../../src/i18n/locales';
import { currentMilestone, publishedRoutes, type Route } from '../../src/routes/routes';
import { routePath } from '../../src/routes/urls';

type Fixtures = {
  /** Requests that left the preview server's origin; any one fails the test (REQ-WEB-003). */
  thirdPartyRequests: string[];
  /** Uncaught errors and console errors (a hydration mismatch shows up here). */
  pageErrors: string[];
};

/**
 * Every website e2e test: requests that leave the website's origin are aborted and fail the test
 * (D-250), and so do script errors, including hydration errors.
 */
export const test = base.extend<Fixtures>({
  thirdPartyRequests: [
    async ({ context, baseURL }, use) => {
      const origin = new URL(baseURL ?? '').origin;
      const outside: string[] = [];
      await context.route('**/*', (route) => {
        const url = route.request().url();
        if (new URL(url).origin === origin) return route.continue();
        outside.push(url);
        return route.abort('blockedbyclient');
      });
      await use(outside);
      expect(outside, 'requests that left the website (REQ-WEB-003)').toEqual([]);
    },
    { auto: true },
  ],

  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await use(errors);
      expect(errors, 'script errors on the page').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** One page of the website in one language, as a visitor opens it. */
export type RouteCase = { name: string; path: string; locale: Locale };

/** Every published route in every language, plus the 404 page. */
export function routeCases(): RouteCase[] {
  const routes: readonly Route[] = publishedRoutes(currentMilestone());
  const cases = routes.flatMap((route) =>
    (['en', 'nl'] as const).map((locale) => ({
      name: `${route.page} (${locale})`,
      path: routePath(route, locale),
      locale,
    })),
  );
  return [...cases, { name: '404', path: '/SiteMark/404.html', locale: 'en' }];
}

/** The theme the page shows: forced by the toggle, else the OS (emulated by Playwright). */
export function htmlTheme(page: Page): Promise<string | undefined> {
  return page.evaluate(() => document.documentElement.dataset.theme);
}
