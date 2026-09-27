import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';
import { fixtureUrl } from './hosts';
import { waitForMarker } from './marker';
import { openPopupFor, type TabsApi } from './popup-page';

// The popup in the real extension (T-122). It is opened as popup.html?tabId=<id> in a tab of its
// own, which only e2e builds honour (src/ui/hooks/use-current-tab.ts): Playwright can't click the
// toolbar button.

test.describe('REQ-POP-001 REQ-POP-006 the popup in the real extension', () => {
  test('Mark this site adds a group for the host, lists it and shows the ribbon', {
    tag: ['@REQ-POP-001', '@REQ-POP-006'],
  }, async ({ context, serviceWorker, extensionId }) => {
    const { site, popup } = await openPopupFor(
      context,
      serviceWorker,
      extensionId,
      fixtureUrl('prod'),
    );
    await expect(popup.getByText('No site group matches this site')).toBeVisible();
    // prod.sitemark.test is pre-granted, so the synchronous request resolves without a prompt.
    await popup.getByRole('button', { name: 'Mark this site' }).click();
    const groups = popup.getByRole('list', { name: 'Site groups on this site' });
    await expect(groups.getByRole('listitem')).toHaveText(['prod.sitemark.test']);
    const marker = await waitForMarker(site);
    // The ribbon shows the host cut to 16 characters (REQ-POP-006).
    await expect(marker).toContainText('prod.sitemark.te');
  });

  test('Hide on this tab follows the marker in the tab', {
    tag: ['@REQ-POP-003', '@REQ-RND-008'],
  }, async ({ context, serviceWorker, extensionId }) => {
    const { site, popup } = await openPopupFor(
      context,
      serviceWorker,
      extensionId,
      fixtureUrl('prod'),
    );
    const markThisSite = popup.getByRole('button', { name: 'Mark this site' });
    await expect(markThisSite).toBeVisible();
    await markThisSite.click();
    await waitForMarker(site);
    await popup.reload();
    const hide = popup.getByRole('button', { name: 'Hide on this tab' });
    await expect(hide).toHaveAttribute('aria-pressed', 'false');
    await hide.click();
    await expect(hide).toHaveAttribute('aria-pressed', 'true');
    await hide.click();
    await expect(hide).toHaveAttribute('aria-pressed', 'false');
  });

  test("says it can't run on a browser page", { tag: ['@REQ-POP-005', '@REQ-ENV-003'] }, async ({
    context,
    serviceWorker,
    extensionId,
  }) => {
    const site = await context.newPage();
    await site.goto('chrome://version/');
    await site.bringToFront();
    // The browser withholds this tab's URL from the extension, but not its id.
    const tabId = await serviceWorker.evaluate(async () => {
      const { chrome } = globalThis as unknown as { chrome: TabsApi };
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      return tab?.id;
    });
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html?tabId=${tabId}`);
    await expect(popup.getByText("SiteMark can't run on this page")).toBeVisible();
    await expect(popup.getByRole('button', { name: 'Pick element' })).toBeDisabled();
  });
});

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test.describe('REQ-A11Y-004 axe finds no serious or critical issue in the popup', () => {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`in ${colorScheme}`, { tag: '@REQ-A11Y-004' }, async ({
      context,
      serviceWorker,
      extensionId,
    }) => {
      const { popup } = await openPopupFor(context, serviceWorker, extensionId, fixtureUrl('prod'));
      await popup.emulateMedia({ colorScheme });
      const markThisSite = popup.getByRole('button', { name: 'Mark this site' });
      await expect(markThisSite).toBeVisible();
      await markThisSite.click();
      await expect(popup.getByRole('list', { name: 'Site groups on this site' })).toBeVisible();
      const { violations } = await new AxeBuilder({ page: popup }).withTags(WCAG).analyze();
      const serious = violations
        .filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))
        .map(({ id, nodes }) => `${id}: ${nodes.map((node) => node.target.join(' ')).join(', ')}`);
      expect(serious).toEqual([]);
    });
  }
});
