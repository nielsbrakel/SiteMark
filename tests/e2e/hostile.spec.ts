import { expect, test } from './fixtures';
import { fixtureUrl } from './hosts';
import { aRibbonMark, seedSiteGroup } from './state';

type Stats = { removals: number; hides: number };

test('the removal and hidePopover loops of a hostile page never make SiteMark spin; planted hosts are left alone @REQ-SEC-006', async ({
  context,
  extensionId,
}) => {
  await seedSiteGroup(context, extensionId, {
    patterns: ['*://prod.sitemark.test/*'],
    marks: [aRibbonMark('PROD')],
  });
  const page = await context.newPage();
  await page.goto(fixtureUrl('prod', 'hostile.html'));
  const stats = () =>
    page.evaluate(() => (window as unknown as { hostileStats: Stats }).hostileStats);
  // The host keeps coming back (the page's removal loop has something to remove)…
  await expect.poll(async () => (await stats()).removals).toBeGreaterThan(0);
  await page.waitForTimeout(5000);
  // …but re-attaching and re-promoting are rate-limited to 10 per 10 s each.
  const { removals, hides } = await stats();
  expect(removals).toBeLessThanOrEqual(11);
  expect(hides).toBeLessThanOrEqual(11);
  expect(await page.evaluate(() => document.getElementById('planted-top')?.textContent)).toBe(
    'Planted host',
  );
});
