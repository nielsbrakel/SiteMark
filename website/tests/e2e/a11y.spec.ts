import AxeBuilder from '@axe-core/playwright';
import { expect, routeCases, test } from './fixtures';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test.describe('REQ-WEBUX-005 axe finds no serious or critical issue in light and dark, en and nl', () => {
  for (const colorScheme of ['light', 'dark'] as const) {
    for (const { name, path } of routeCases()) {
      test(`${name} in ${colorScheme}`, { tag: '@REQ-WEBUX-005' }, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        await page.goto(path);
        const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
        const serious = violations
          .filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))
          .map(
            ({ id, nodes }) => `${id}: ${nodes.map((node) => node.target.join(' ')).join(', ')}`,
          );
        expect(serious).toEqual([]);
      });
    }
  }
});

test.describe('REQ-WEBUX-005 every page reflows at 320 px and 200 % zoom', () => {
  // 200 % zoom of a 1280 px window leaves 640 CSS pixels; 320 px is the WCAG 1.4.10 reflow width.
  for (const width of [320, 640]) {
    test(`no horizontal scrolling at ${width} px`, { tag: '@REQ-WEBUX-005' }, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      const scrolling: string[] = [];
      for (const { name, path } of routeCases()) {
        await page.goto(path);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        if (overflow > 0) scrolling.push(`${name}: ${overflow} px too wide`);
      }
      expect(scrolling).toEqual([]);
    });
  }
});

test.describe('REQ-WEB-003 the website makes no third-party requests', () => {
  test('loads every page from the website only', { tag: '@REQ-WEB-003' }, async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    for (const { path } of routeCases()) await page.goto(path);
    expect(requests.length).toBeGreaterThan(0);
    const origin = new URL(page.url()).origin;
    expect(requests.filter((url) => new URL(url).origin !== origin)).toEqual([]);
  });
});
