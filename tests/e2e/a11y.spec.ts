import type { BrowserContext, Locator, Page } from '@playwright/test';
import { seriousViolations } from './axe';
import { expect, test } from './fixtures';
import { aRibbonMark, seedSiteGroup } from './state';

// Accessibility of the options page and the grant page in the real extension (T-148, T-149).
// The popup's axe checks live in popup.spec.ts.

/** A site group with two patterns, a page mark and an element mark, and a second one. */
async function seedGroups(context: BrowserContext, extensionId: string) {
  await seedSiteGroup(context, extensionId, {
    name: 'Staging',
    patterns: ['*://test.sitemark.test/*'],
    marks: [aRibbonMark('STAGING')],
  });
  const state = await seedSiteGroup(context, extensionId, {
    name: 'Production',
    patterns: ['*://prod.sitemark.test/*', 'https://prod.sitemark.test/admin/*'],
    marks: [
      aRibbonMark('PROD'),
      {
        enabled: true,
        color: '#1f6feb',
        textColor: 'auto',
        label: 'Delete button',
        target: { kind: 'element', selector: '#delete' },
        effects: { outline: { widthPx: 2, style: 'solid', pulse: false } },
      },
    ],
  });
  const group = state.siteGroups.at(-1);
  const mark = group?.marks[0];
  if (!group || !mark) throw new Error('The site group was not seeded');
  return { groupId: group.id, markId: mark.id };
}

type View = {
  readonly name: string;
  readonly path: string;
  /** What shows once the view has rendered. */
  readonly ready: (page: Page) => Locator;
};

function optionsViews(groupId: string, markId: string): View[] {
  const heading = (page: Page, name: string) => page.getByRole('heading', { level: 2, name });
  return [
    {
      name: 'the site group list and a group with its patterns',
      path: `options.html#/groups/${groupId}`,
      ready: (page) => heading(page, 'Production'),
    },
    {
      name: 'the mark editor',
      path: `options.html#/groups/${groupId}/marks/${markId}`,
      ready: (page) => page.getByRole('region', { name: 'Edit mark' }),
    },
    {
      name: 'the settings',
      path: 'options.html#/settings',
      ready: (page) => heading(page, 'Settings'),
    },
    { name: 'the data page', path: 'options.html#/data', ready: (page) => heading(page, 'Data') },
    {
      name: 'the welcome page',
      path: 'options.html#/welcome',
      ready: (page) => page.getByRole('heading', { level: 2 }).first(),
    },
    {
      name: 'the grant page',
      path: `grant.html?origins=${encodeURIComponent('*://new.sitemark.test/*')}`,
      ready: (page) => page.getByRole('button', { name: 'Allow' }),
    },
  ];
}

test.describe('REQ-A11Y-004 axe finds no serious or critical issue in the options and grant pages', () => {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`in ${colorScheme}`, { tag: '@REQ-A11Y-004' }, async ({ context, extensionId }) => {
      const { groupId, markId } = await seedGroups(context, extensionId);
      const page = await context.newPage();
      await page.emulateMedia({ colorScheme });
      const found: Record<string, string[]> = {};
      for (const view of optionsViews(groupId, markId)) {
        await page.goto(`chrome-extension://${extensionId}/${view.path}`);
        await expect(view.ready(page)).toBeVisible();
        const serious = await seriousViolations(page);
        if (serious.length) found[view.name] = serious;
      }
      expect(found).toEqual({});
    });
  }
});
