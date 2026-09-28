import type { BrowserContext, Page } from '@playwright/test';
import type { SiteGroup, SiteMarkState } from '../../src/core/model/schema';
import { sendFromPage } from './background';
import { expect, test } from './fixtures';
import { aRibbonMark, seedSiteGroup } from './state';

// The options page in the real extension: what component tests can't show (native drag and drop,
// a real file import and its permission request).

async function seedGroups(context: BrowserContext, extensionId: string, names: string[]) {
  let state: SiteMarkState | undefined;
  for (const name of names) {
    state = await seedSiteGroup(context, extensionId, {
      name,
      patterns: ['*://prod.sitemark.test/*'],
      marks: [aRibbonMark(name.toUpperCase())],
    });
  }
  if (!state) throw new Error('Nothing was seeded');
  return state;
}

/** The state as the background has it now. */
async function storedState(page: Page): Promise<SiteMarkState> {
  const reply = (await sendFromPage(page, { type: 'getState' })) as { value: SiteMarkState };
  return reply.value;
}

const siteGroupLinks = (page: Page) =>
  page.getByRole('complementary', { name: 'Site groups' }).getByRole('link');

test.describe('REQ-GRP-004 reorder site groups by drag and drop', () => {
  test('dropping a group on another moves it to that place, for good', {
    tag: '@REQ-GRP-004',
  }, async ({ context, extensionId }) => {
    await seedGroups(context, extensionId, ['Production', 'Staging', 'Local']);
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html#/`);
    const rows = page.getByRole('complementary', { name: 'Site groups' }).getByRole('listitem');
    await expect(siteGroupLinks(page)).toHaveText(['Production', 'Staging', 'Local']);

    await rows.filter({ hasText: 'Local' }).dragTo(rows.filter({ hasText: 'Production' }));
    await expect(siteGroupLinks(page)).toHaveText(['Local', 'Production', 'Staging']);

    // The background stored the new priority order.
    const names = (await storedState(page)).siteGroups.map((group) => group.name);
    expect(names).toEqual(['Local', 'Production', 'Staging']);
    await page.reload();
    await expect(siteGroupLinks(page)).toHaveText(['Local', 'Production', 'Staging']);
  });
});

// ── Import (T-139) ────────────────────────────────────────────────────────────────────────────

/** A site group that only the file has, on two sites the e2e build doesn't pre-grant. */
const NEW_SITES: SiteGroup = {
  id: 'importGroup1',
  name: 'New sites',
  enabled: true,
  patterns: [
    { id: 'importPatt01', kind: 'wildcard', value: '*://new.sitemark.test/*' },
    {
      id: 'importPatt02',
      kind: 'regex',
      value: '^https?://other\\.sitemark\\.test/admin/',
      origins: ['*://other.sitemark.test/*'],
    },
  ],
  excludes: [],
  marks: [
    {
      id: 'importMark01',
      enabled: true,
      color: '#1f6feb',
      textColor: 'auto',
      target: { kind: 'page' },
      effects: { ribbon: { text: 'NEW', corner: 'top-right' } },
    },
  ],
} as unknown as SiteGroup;

/** An export file holding these site groups and the dark theme. */
function exportFile(siteGroups: readonly SiteGroup[]) {
  const envelope = {
    format: 'sitemark-export',
    schemaVersion: 1,
    appVersion: '1.0.0',
    exportedAt: new Date(0).toISOString(),
    siteGroups,
    settings: { theme: 'dark' },
  };
  return {
    name: 'sitemark-export.json',
    mimeType: 'application/json',
    buffer: Buffer.from(`${JSON.stringify(envelope, null, 2)}\n`),
  };
}

/**
 * Records every `permissions.request` of the extension's pages and answers it as if the user
 * denied: a real prompt can't be answered from Playwright. Imported groups arrive either way.
 */
async function recordPermissionRequests(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    type Request = (permissions: { origins?: string[] }) => Promise<boolean>;
    const api = (globalThis as unknown as { chrome?: { permissions?: { request: Request } } })
      .chrome?.permissions;
    if (!api) return;
    const requests: string[][] = [];
    Object.assign(globalThis, { sitemarkRequests: requests });
    api.request = async ({ origins = [] }) => {
      requests.push(origins);
      return false;
    };
  });
}

const permissionRequests = (page: Page) =>
  page.evaluate(() => (globalThis as unknown as { sitemarkRequests: string[][] }).sitemarkRequests);

async function openImport(page: Page, extensionId: string, file: ReturnType<typeof exportFile>) {
  await page.goto(`chrome-extension://${extensionId}/options.html#/data`);
  const section = page.getByRole('region', { name: 'Import' });
  await section.getByLabel('Choose an export file').setInputFiles(file);
  return section;
}

test.describe('REQ-OPT-005 REQ-DATA-004 REQ-DATA-005 import: preview, merge or replace, one prompt', () => {
  test('previews the file, then merges it after one request for every new site', {
    tag: ['@REQ-OPT-005', '@REQ-DATA-004', '@REQ-DATA-005'],
  }, async ({ context, extensionId }) => {
    const state = await seedGroups(context, extensionId, ['Production', 'Staging']);
    const [production] = state.siteGroups as [SiteGroup];
    await recordPermissionRequests(context);
    const page = await context.newPage();
    const file = exportFile([{ ...production, name: 'Production (file)' }, NEW_SITES]);
    const section = await openImport(page, extensionId, file);

    await expect(section).toContainText('1 site group updated, 1 new site group');
    await expect(section).toContainText('2 new sites to allow');
    await expect(section).toContainText('^https?://other\\.sitemark\\.test/admin/');
    expect((await storedState(page)).siteGroups).toEqual(state.siteGroups);

    await section.getByRole('button', { name: 'Import' }).click();
    await expect(section).toContainText('Imported.');
    await expect(siteGroupLinks(page)).toHaveText(['Production (file)', 'Staging', 'New sites']);
    expect(await permissionRequests(page)).toEqual([
      ['*://new.sitemark.test/*', '*://other.sitemark.test/*'],
    ]);
    // Merge keeps the local settings (D-218).
    expect((await storedState(page)).settings.theme).toBe('system');
  });

  test('replaces every site group and the settings once confirmed', {
    tag: ['@REQ-OPT-005', '@REQ-DATA-004', '@REQ-DATA-005'],
  }, async ({ context, extensionId }) => {
    await seedGroups(context, extensionId, ['Local only']);
    await recordPermissionRequests(context);
    const page = await context.newPage();
    const section = await openImport(page, extensionId, exportFile([NEW_SITES]));

    await section.getByRole('radiogroup', { name: 'Import mode' }).getByText('Replace').click();
    await section.getByRole('button', { name: 'Import' }).click();
    const dialog = page.getByRole('dialog', { name: 'Replace all site groups and settings?' });
    await expect(dialog).toBeVisible();
    expect(await permissionRequests(page)).toEqual([]);
    await dialog.getByRole('button', { name: 'Replace' }).click();

    await expect(siteGroupLinks(page)).toHaveText(['New sites']);
    expect(await permissionRequests(page)).toEqual([
      ['*://new.sitemark.test/*', '*://other.sitemark.test/*'],
    ]);
    expect((await storedState(page)).settings.theme).toBe('dark');
  });
});
