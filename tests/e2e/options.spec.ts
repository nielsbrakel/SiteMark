import type { BrowserContext } from '@playwright/test';
import type { SiteMarkState } from '../../src/core/model/schema';
import { sendFromPage } from './background';
import { expect, test } from './fixtures';
import { aRibbonMark, seedSiteGroup } from './state';

// The options page in the real extension: what component tests can't show (native drag and drop).

async function seedGroups(context: BrowserContext, extensionId: string, names: string[]) {
  for (const name of names) {
    await seedSiteGroup(context, extensionId, {
      name,
      patterns: ['*://prod.sitemark.test/*'],
      marks: [aRibbonMark(name.toUpperCase())],
    });
  }
}

test.describe('REQ-GRP-004 reorder site groups by drag and drop', () => {
  test('dropping a group on another moves it to that place, for good', {
    tag: '@REQ-GRP-004',
  }, async ({ context, extensionId }) => {
    await seedGroups(context, extensionId, ['Production', 'Staging', 'Local']);
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html#/`);
    const sidebar = page.getByRole('complementary', { name: 'Site groups' });
    const rows = sidebar.getByRole('listitem');
    await expect(sidebar.getByRole('link')).toHaveText(['Production', 'Staging', 'Local']);

    await rows.filter({ hasText: 'Local' }).dragTo(rows.filter({ hasText: 'Production' }));
    await expect(sidebar.getByRole('link')).toHaveText(['Local', 'Production', 'Staging']);

    // The background stored the new priority order.
    const reply = (await sendFromPage(page, { type: 'getState' })) as { value: SiteMarkState };
    expect(reply.value.siteGroups.map((group) => group.name)).toEqual([
      'Local',
      'Production',
      'Staging',
    ]);
    await page.reload();
    await expect(sidebar.getByRole('link')).toHaveText(['Local', 'Production', 'Staging']);
  });
});
