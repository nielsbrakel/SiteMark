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

test.describe('REQ-PLAY-005 the playground works by keyboard and without motion', () => {
  test('changes the preset, the ribbon corner and the text with the keyboard', {
    tag: '@REQ-PLAY-005',
  }, async ({ page }) => {
    await page.goto('/SiteMark/playground/');
    const status = page.getByRole('status');
    await expect(status).toContainText('in red');
    await page.getByRole('radio', { name: 'Red' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: 'Amber' })).toBeChecked();
    await expect(page.getByRole('radio', { name: 'Amber' })).toBeFocused();
    await expect(status).toContainText('in amber');
    await page.getByRole('combobox', { name: 'Ribbon corner' }).selectOption('bottom-left');
    await expect(page.getByRole('combobox', { name: 'Ribbon corner' })).toHaveValue('bottom-left');
    await page.getByRole('textbox', { name: 'Mark text' }).focus();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('LIVE');
    await expect(status).toContainText('“LIVE”');
  });

  test('moves nothing under prefers-reduced-motion', { tag: '@REQ-PLAY-005' }, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/SiteMark/playground/');
    await expect(page.getByRole('status')).toContainText('in red');
    const moving = await page
      .locator('[data-island="playground"] *')
      .evaluateAll(
        (elements) =>
          elements
            .map((element) => getComputedStyle(element))
            .filter(
              (style) =>
                style.animationName !== 'none' ||
                style.transitionDuration
                  .split(',')
                  .some((duration) => Number.parseFloat(duration) > 0),
            ).length,
      );
    expect(moving).toBe(0);
  });
});
