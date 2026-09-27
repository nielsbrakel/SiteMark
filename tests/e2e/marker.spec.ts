import { expect, test } from './fixtures';
import { fixtureUrl } from './hosts';
import { waitForMarker } from './marker';
import { aRibbonMark, seedSiteGroup } from './state';

// Sanity check of the helper itself. Marks on real pages need the background wiring (T-076) and
// the renderer (T-081+); their specs use waitForMarker() against the injected marker.
test('waitForMarker pierces an open shadow root and ignores a planted <sitemark-root>', async ({
  page,
}) => {
  await page.goto(fixtureUrl('prod'));
  await page.evaluate(() => {
    const planted = document.createElement('sitemark-root');
    planted.append(document.createElement('div'));
    document.documentElement.append(planted);
    setTimeout(() => {
      const host = document.createElement('sitemark-root');
      const container = document.createElement('div');
      container.setAttribute('data-sitemark-root', '');
      container.textContent = 'marker views';
      host.attachShadow({ mode: 'open' }).append(container);
      document.documentElement.append(host);
    }, 200);
  });
  const root = await waitForMarker(page);
  await expect(root).toHaveText('marker views');
  expect(await root.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(true);
});

test('marks are hidden when printing @REQ-RND-010', async ({ context, extensionId }) => {
  await seedSiteGroup(context, extensionId, {
    patterns: ['*://prod.sitemark.test/*'],
    marks: [aRibbonMark('PROD')],
  });
  const page = await context.newPage();
  await page.goto(fixtureUrl('prod'));
  const ribbon = (await waitForMarker(page)).locator('.sm-ribbon__text');
  await expect(ribbon).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(ribbon).toBeHidden();
  await page.emulateMedia({ media: 'screen' });
  await expect(ribbon).toBeVisible();
});
