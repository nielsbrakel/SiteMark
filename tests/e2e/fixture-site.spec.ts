import { expect, test } from './fixtures';
import { fixtureUrl } from './hosts';

// Sanity checks of the fixture site itself (T-077), so feature specs can trust its pages.

type HostileWindow = { hostileStats: { removals: number; hides: number } };

test('the dashboard has the actions and the customer table', async ({ page }) => {
  await page.goto(fixtureUrl('prod'));
  await expect(page.getByTestId('delete-customer')).toHaveText('Delete customer');
  await expect(page.getByTestId('customers').getByRole('row')).toHaveCount(4);
});

test('the SPA routes with pushState and changes the title', async ({ page }) => {
  await page.goto(fixtureUrl('prod', 'spa/'));
  await expect(page).toHaveTitle('Overview · SPA fixture');
  await page.getByRole('link', { name: 'Orders' }).click();
  await expect(page).toHaveURL(fixtureUrl('prod', 'spa/orders'));
  await expect(page).toHaveTitle('Orders · SPA fixture');
  await expect(page.getByTestId('orders-action')).toBeVisible();
  await page.goBack();
  await expect(page).toHaveTitle('Overview · SPA fixture');
  await page.goto(fixtureUrl('prod', 'spa/settings'));
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
});

test('lazy content appears after the delay', async ({ page }) => {
  await page.goto(fixtureUrl('prod', 'lazy.html?delay=300'));
  await expect(page.getByTestId('lazy-action')).toBeVisible();
  await page.getByRole('button', { name: 'Move target', exact: true }).click();
  await expect(page.getByTestId('slot-b').getByTestId('lazy-action')).toBeVisible();
});

test('the nested scroll target sits below the fold of two scroll containers', async ({ page }) => {
  await page.goto(fixtureUrl('prod', 'scroll.html'));
  await expect(page.getByTestId('inner-scroller').getByTestId('nested-target')).toBeAttached();
  await expect(page.getByTestId('nested-target')).not.toBeInViewport();
});

test('the dialog opens modally and the popover toggles', async ({ page }) => {
  await page.goto(fixtureUrl('prod', 'dialog.html'));
  await page.getByRole('button', { name: 'Toggle popover' }).click();
  await expect(page.locator('#page-popover')).toBeVisible();
  await page.getByRole('button', { name: 'Open dialog' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.locator('#dialog').evaluate((d) => d.matches(':modal'))).toBe(true);
});

test('the stage enters fullscreen', async ({ page }) => {
  await page.goto(fixtureUrl('prod', 'fullscreen.html'));
  // The welcome tab opened on install may be the active tab; fullscreen needs a focused page.
  await page.bringToFront();
  await page.getByRole('button', { name: 'Enter fullscreen' }).click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('stage');
});

test('the strict CSP page blocks inline code and enforces Trusted Types', async ({ page }) => {
  const response = await page.goto(fixtureUrl('prod', 'csp.html'));
  expect(response?.headers()['content-security-policy']).toContain("style-src 'self'");
  await expect(page.getByTestId('csp-status')).toHaveText('The page script ran under the CSP.');
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-trusted-types', 'enforced');
  await expect(body).not.toHaveAttribute('data-inline-script', /.*/);
  await expect(page.locator('#inline-probe')).not.toHaveCSS('color', 'rgb(255, 0, 0)');
});

test('the hostile page plants hosts, removes new top-level nodes and closes popovers', async ({
  page,
}) => {
  await page.goto(fixtureUrl('prod', 'hostile.html'));
  await expect(page.locator('sitemark-root')).toHaveCount(2);
  const survived = await page.evaluate(async () => {
    const intruder = document.createElement('div');
    document.documentElement.append(intruder);
    await new Promise((resolve) => setTimeout(resolve, 0));
    return intruder.isConnected;
  });
  expect(survived).toBe(false);
  await page.evaluate(() => document.getElementById('planted-top')?.showPopover());
  await expect
    .poll(() => page.evaluate(() => (window as unknown as HostileWindow).hostileStats))
    .toEqual({ removals: 1, hides: 1 });
});
