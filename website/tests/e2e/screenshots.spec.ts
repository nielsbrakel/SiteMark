import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const SCENES = ['marked-page', 'popup', 'options'] as const;

/** The screenshot the visitor sees, as the browser loaded it (hidden scenes and themes stay unloaded). */
async function visibleScreenshot(page: Page): Promise<string> {
  const image = page.locator('picture[data-theme] img').filter({ visible: true });
  await expect(image).toHaveCount(1);
  await image.scrollIntoViewIfNeeded();
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete)).toBe(true);
  return image.evaluate((img: HTMLImageElement) => new URL(img.currentSrc).pathname);
}

/** Picks every scene of the tour in turn and returns what showed. */
async function tour(page: Page): Promise<string[]> {
  const sources: string[] = [];
  for (const scene of SCENES) {
    await page.locator(`label[for="scene-${scene}"]`).click();
    sources.push(await visibleScreenshot(page));
  }
  return sources;
}

test.describe('REQ-PAGE-008 the home page shows the screenshots of the active language and theme', () => {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`follows the OS in ${colorScheme}`, { tag: '@REQ-PAGE-008' }, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('/SiteMark/nl/');
      expect(await visibleScreenshot(page)).toBe(
        `/SiteMark/screenshots/marked-page-${colorScheme}-nl.webp`,
      );
      expect(await tour(page)).toEqual(
        SCENES.map((scene) => `/SiteMark/screenshots/${scene}-${colorScheme}-nl.webp`),
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
    // The dark images start loading only once they show: poll until the scene is in.
    await expect.poll(() => visibleScreenshot(page)).toMatch(/-dark-en\.webp$/);
    expect((await tour(page)).every((src) => src.endsWith('-dark-en.webp'))).toBe(true);
  });
});
