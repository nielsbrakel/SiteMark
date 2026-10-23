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
      await expect(page.getByRole('radiogroup', { name: 'Kleur' })).toBeHidden();
      await context.close();
    });
  }

  test('shows the live playground, not the image, with JavaScript', {
    tag: '@REQ-PLAY-003',
  }, async ({ page }) => {
    await page.goto('/SiteMark/playground/');
    await expect(page.getByRole('radiogroup', { name: 'Color', exact: true })).toBeVisible();
    await expect(page.getByRole('figure', { name: 'Preview of a marked page' })).toBeVisible();
    await expect(page.getByText('The playground needs JavaScript.')).toBeHidden();
    await expect(page.getByRole('img', { name: /^The playground's preview/ })).toBeHidden();
  });
});

test.describe('REQ-PLAY-004 the home hero compares the shop without and with SiteMark', () => {
  test('moves the divider with the keyboard, and shows the marked shop at rest without JavaScript', {
    tag: '@REQ-PLAY-004',
  }, async ({ page, browser }) => {
    await page.goto('/SiteMark/');
    const slider = page.getByRole('slider', { name: 'Compare the shop without and with SiteMark' });
    await expect(slider).toBeVisible();
    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveValue('51');
    const context = await browser.newContext({ javaScriptEnabled: false });
    const noScript = await context.newPage();
    await noScript.goto('/SiteMark/');
    await expect(noScript.getByText('with SiteMark')).toBeVisible();
    await context.close();
  });

  test('centres the round grip on the divider line', { tag: '@REQ-PLAY-004' }, async ({ page }) => {
    await page.goto('/SiteMark/');
    const grip = page.locator('[data-compare] svg');
    const line = grip.locator('xpath=../..');
    await expect(grip).toBeVisible();
    const [gripBox, lineBox] = await Promise.all([grip.boundingBox(), line.boundingBox()]);
    const center = (box: { x: number; width: number } | null) =>
      (box?.x ?? 0) + (box?.width ?? 0) / 2;
    expect(Math.abs(center(gripBox) - center(lineBox))).toBeLessThan(1);
  });
});
