import { expect, test } from './fixtures';

test.describe('REQ-PLAY-003 without JavaScript the playground shows an image of its preview', () => {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`shows the ${colorScheme} image and says the playground needs JavaScript`, {
      tag: '@REQ-PLAY-003',
    }, async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false, colorScheme });
      const page = await context.newPage();
      await page.goto('/SiteMark/nl/playground/');
      await expect(page.getByText('Uitproberen werkt alleen met JavaScript.')).toBeVisible();
      const image = page.getByRole('img', { name: /^Het voorbeeld van Uitproberen/ });
      await expect(image).toBeVisible();
      await expect
        .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
        .toBeGreaterThan(0);
      const source = await image.evaluate((img: HTMLImageElement) => img.currentSrc);
      expect(new URL(source).pathname).toBe(`/SiteMark/playground/preview-${colorScheme}-nl.webp`);
      // The controls can't work without JavaScript, so they aren't shown.
      await expect(page.getByRole('group', { name: 'Kleur' })).toBeHidden();
      await context.close();
    });
  }

  test('shows the live playground, not the image, with JavaScript', {
    tag: '@REQ-PLAY-003',
  }, async ({ page }) => {
    await page.goto('/SiteMark/playground/');
    await expect(page.getByRole('group', { name: 'Color' })).toBeVisible();
    await expect(page.getByRole('figure', { name: 'Preview of a marked page' })).toBeVisible();
    await expect(page.getByText('The playground needs JavaScript.')).toBeHidden();
    await expect(page.getByRole('img', { name: /^The playground's preview/ })).toBeHidden();
  });
});

test.describe('REQ-PLAY-004 the home hero is a small playground', () => {
  test('shows the presets with JavaScript and the preview image without', {
    tag: ['@REQ-PLAY-004', '@REQ-PLAY-003'],
  }, async ({ page, browser }) => {
    await page.goto('/SiteMark/');
    const hero = page.locator('section', { has: page.getByRole('heading', { level: 1 }) });
    await expect(hero.getByRole('radio')).toHaveCount(4);
    await hero.getByRole('radio', { name: 'Blue' }).check();
    await expect(hero.getByRole('radio', { name: 'Blue' })).toBeChecked();
    const context = await browser.newContext({ javaScriptEnabled: false });
    const noScript = await context.newPage();
    await noScript.goto('/SiteMark/');
    await expect(noScript.getByRole('img', { name: /^The playground's preview/ })).toBeVisible();
    await expect(noScript.getByRole('radio')).toHaveCount(0);
    await context.close();
  });
});
