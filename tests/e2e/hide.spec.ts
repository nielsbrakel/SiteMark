import { dispatchCommand } from './background';
import { expect, test } from './fixtures';
import { fixtureUrl } from './hosts';
import { waitForMarker } from './marker';
import { seedSiteGroup } from './state';

const prodMark = {
  enabled: true,
  color: '#c93a2e',
  textColor: 'auto',
  target: { kind: 'page' },
  effects: { ribbon: { text: 'PROD', corner: 'top-right' }, titlePrefix: { text: 'PROD' } },
};

test('hide on this tab hides the marks and the title prefix, survives SPA routes, resets on reload @REQ-RND-008 @REQ-CMD-002', async ({
  context,
  extensionId,
  serviceWorker,
}) => {
  await seedSiteGroup(context, extensionId, {
    patterns: ['*://prod.sitemark.test/*'],
    marks: [prodMark],
  });
  const page = await context.newPage();
  await page.goto(fixtureUrl('prod', 'spa/'));
  await page.bringToFront();
  const root = await waitForMarker(page);
  await expect(page).toHaveTitle('PROD Overview · SPA fixture');

  expect(await dispatchCommand(serviceWorker, 'toggle-hide')).toBe(true);
  await expect(root).toBeHidden();
  await expect(page).toHaveTitle('Overview · SPA fixture');

  await page.getByRole('link', { name: 'Orders' }).click();
  await expect(page).toHaveTitle('Orders · SPA fixture');
  await page.waitForTimeout(1000);
  await expect(root).toBeHidden();
  await expect(page).toHaveTitle('Orders · SPA fixture');

  expect(await dispatchCommand(serviceWorker, 'toggle-hide')).toBe(true);
  await expect(root).toBeVisible();
  await expect(page).toHaveTitle('PROD Orders · SPA fixture');

  expect(await dispatchCommand(serviceWorker, 'toggle-hide')).toBe(true);
  await expect(root).toBeHidden();
  await page.reload();
  await expect(await waitForMarker(page)).toBeVisible();
  await expect(page).toHaveTitle('PROD Orders · SPA fixture');
});
