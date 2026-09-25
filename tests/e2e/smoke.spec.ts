import { expect, test } from './fixtures';

test('extension loads and the popup renders', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(page.getByRole('heading', { name: 'SiteMark' })).toBeVisible();
});

// REQ-PRIV-001/002: no install-time host access, nothing injected statically.
test('manifest requests no host access at install time', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/manifest.json`);
  const manifest = JSON.parse((await page.locator('body').textContent()) ?? '{}');
  expect(manifest.host_permissions ?? []).toEqual([]);
  expect(manifest.content_scripts ?? []).toEqual([]);
  expect(manifest.permissions).not.toContain('<all_urls>');
  expect(manifest.optional_host_permissions).toEqual(['*://*/*']);
});
