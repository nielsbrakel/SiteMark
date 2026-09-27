import { expect, test } from './fixtures';
import { fixtureUrl } from './hosts';
import { waitForMarker } from './marker';
import { aRibbonMark, seedSiteGroup } from './state';

const MARKER_ROOT = 'sitemark-root [data-sitemark-root]';

test('SPA navigation brings and removes the marks of a route @REQ-RND-004', async ({
  context,
  extensionId,
}) => {
  await seedSiteGroup(context, extensionId, {
    patterns: ['*://prod.sitemark.test/spa/orders*'],
    marks: [aRibbonMark('ORDERS')],
  });
  const page = await context.newPage();
  await page.goto(fixtureUrl('prod', 'spa/'));
  await page.bringToFront();
  await page.getByRole('link', { name: 'Orders' }).click();
  const root = await waitForMarker(page);
  await expect(root.locator('.sm-ribbon__text')).toHaveText('ORDERS');
  await page.goBack();
  await expect(page.locator(MARKER_ROOT)).toHaveCount(0);
});
