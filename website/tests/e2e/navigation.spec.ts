import { expect, htmlTheme, routeCases, test } from './fixtures';

test.describe('REQ-WEB-002 every page is a prerendered file that works with and without JavaScript', () => {
  test('navigates between pages with plain links', { tag: '@REQ-WEB-002' }, async ({ page }) => {
    await page.goto('/SiteMark/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Never confuse production with test again',
    );
    const nav = page.getByRole('navigation', { name: 'Main' });
    await nav.getByRole('link', { name: 'Support' }).click();
    await expect(page).toHaveURL('/SiteMark/support/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Support');
    await nav.getByRole('link', { name: 'Privacy' }).click();
    await expect(page).toHaveURL('/SiteMark/privacy/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy policy');
    await page.getByRole('banner').getByRole('link', { name: 'SiteMark home' }).click();
    await expect(page).toHaveURL('/SiteMark/');
  });

  test('hydrates every page without script errors', { tag: '@REQ-WEB-002' }, async ({ page }) => {
    for (const { path } of routeCases()) {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-js', '');
    }
    // The pageErrors fixture fails the test on any hydration mismatch or script error.
  });

  test('reads and navigates without JavaScript', { tag: '@REQ-WEB-002' }, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/SiteMark/nl/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Verwar productie nooit meer met test',
    );
    // Without JavaScript the OS decides the theme, so the toggle is hidden.
    await expect(page.getByRole('group', { name: 'Thema' })).toBeHidden();
    await page
      .getByRole('navigation', { name: 'Hoofdmenu' })
      .getByRole('link', { name: 'Privacy' })
      .click();
    await expect(page).toHaveURL('/SiteMark/nl/privacy/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacyverklaring');
    await page
      .getByRole('navigation', { name: 'Taal' })
      .getByRole('link', { name: 'English' })
      .click();
    await expect(page).toHaveURL('/SiteMark/privacy/');
    await context.close();
  });

  test('answers an unknown path with the bilingual 404 page', { tag: '@REQ-PAGE-006' }, async ({
    page,
  }) => {
    await page.goto('/SiteMark/404.html');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
    await expect(page.locator('section[lang="nl"] h2')).toHaveText('Pagina niet gevonden');
    await page.locator('section[lang="nl"]').getByRole('link', { name: 'Ondersteuning' }).click();
    await expect(page).toHaveURL('/SiteMark/nl/support/');
  });
});

test.describe('REQ-WEBUX-004 the language switch keeps the page', () => {
  test('switches between the same page in English and Dutch', { tag: '@REQ-WEBUX-004' }, async ({
    page,
  }) => {
    await page.goto('/SiteMark/support/');
    await page
      .getByRole('navigation', { name: 'Language' })
      .getByRole('link', { name: 'Nederlands' })
      .click();
    await expect(page).toHaveURL('/SiteMark/nl/support/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'nl');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ondersteuning');
    await page
      .getByRole('navigation', { name: 'Taal' })
      .getByRole('link', { name: 'English' })
      .click();
    await expect(page).toHaveURL('/SiteMark/support/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test.describe('REQ-WEBUX-002 the theme choice persists across pages and reloads', () => {
  test('remembers Dark, and Auto follows the OS again', {
    tag: ['@REQ-WEBUX-002', '@REQ-WEB-004'],
  }, async ({ page, context }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/SiteMark/');
    expect(await htmlTheme(page)).toBeUndefined();
    await page.getByRole('group', { name: 'Theme' }).getByRole('button', { name: 'Dark' }).click();
    expect(await htmlTheme(page)).toBe('dark');
    await page.reload();
    expect(await htmlTheme(page)).toBe('dark');
    await expect(page.getByRole('button', { name: 'Dark' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.goto('/SiteMark/nl/privacy/');
    expect(await htmlTheme(page)).toBe('dark');
    // Only the theme key in web storage, and no cookies (REQ-WEB-004).
    const keys = await page.evaluate(() => Object.keys(window.localStorage));
    expect(keys).toEqual(['sitemark-website:theme']);
    expect(await context.cookies()).toEqual([]);
    await page
      .getByRole('group', { name: 'Thema' })
      .getByRole('button', { name: 'Automatisch' })
      .click();
    await page.reload();
    expect(await htmlTheme(page)).toBeUndefined();
  });
});
