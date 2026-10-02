import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/** The screenshots the visitor sees, as the browser loaded them (the hidden theme stays unloaded). */
async function visibleScreenshots(page: Page): Promise<string[]> {
  const images = page.locator('picture[data-theme] img').filter({ visible: true });
  await expect(images).toHaveCount(3);
  const sources: string[] = [];
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete)).toBe(true);
    sources.push(await image.evaluate((img: HTMLImageElement) => new URL(img.currentSrc).pathname));
  }
  return sources;
}

test.describe('REQ-PAGE-008 the home page shows the screenshots of the active language and theme', () => {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`follows the OS in ${colorScheme}`, { tag: '@REQ-PAGE-008' }, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('/SiteMark/nl/');
      expect(await visibleScreenshots(page)).toEqual(
        ['marked-page', 'popup', 'options'].map(
          (scene) => `/SiteMark/screenshots/${scene}-${colorScheme}-nl.webp`,
        ),
      );
    });
  }

  test('follows the theme toggle', { tag: '@REQ-PAGE-008' }, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/SiteMark/');
    await page
      .getByRole('radiogroup', { name: 'Theme' })
      .getByRole('radio', { name: 'Dark' })
      .click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    // The dark images start loading only once they show: poll until all three are in.
    await expect
      .poll(async () =>
        (await visibleScreenshots(page)).every((src) => src.endsWith('-dark-en.webp')),
      )
      .toBe(true);
  });
});
