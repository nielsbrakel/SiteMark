import { expect, test } from './fixtures';
import { E2E_GRANTED_ORIGINS, fixtureUrl } from './hosts';

/** The slice of the extension API that page.evaluate callbacks use inside extension pages. */
type ExtensionPage = {
  chrome: { permissions: { contains(p: { origins: string[] }): Promise<boolean> } };
};

test('extension pages render without console errors under the strict CSP', async ({
  page,
  extensionId,
}) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(page.getByRole('heading', { name: 'SiteMark' })).toBeVisible();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(page.getByRole('heading', { name: 'SiteMark settings' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('the fixture site is served on the sitemark.test hosts', async ({ page }) => {
  await page.goto(fixtureUrl('prod'));
  await expect(page.getByRole('heading', { name: 'Fixture dashboard' })).toBeVisible();
});

// The production manifest is asserted on the real builds in tests/build (T-016).
test('the e2e build pre-grants only prod. and test.sitemark.test', async ({
  page,
  extensionId,
}) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  const granted = await page.evaluate(async (origins) => {
    const { permissions } = (globalThis as unknown as ExtensionPage).chrome;
    const has = (origin: string) => permissions.contains({ origins: [origin] });
    return {
      e2e: await Promise.all(origins.map(has)),
      new: await has('*://new.sitemark.test/*'),
      all: await has('*://*/*'),
    };
  }, E2E_GRANTED_ORIGINS);
  expect(granted).toEqual({ e2e: [true, true], new: false, all: false });
});

test('the network guard aborts requests outside the fixture hosts', async ({
  page,
  blockedRequests,
}) => {
  await page.goto(fixtureUrl('prod', 'leak.html'));
  await expect.poll(() => blockedRequests).toEqual(['https://tracker.example.com/pixel.gif']);
  blockedRequests.length = 0;
});
