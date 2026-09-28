import type { BrowserContext, Locator, Page } from '@playwright/test';
import { seriousViolations } from './axe';
import { expect, test } from './fixtures';
import { fixtureUrl } from './hosts';
import { openPopupFor } from './popup-page';
import { overflowing, scrollsHorizontally } from './reflow';
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

/** What needs horizontal scrolling on the page, if anything. */
async function reflowProblems(page: Page): Promise<string[]> {
  const scrolls = await scrollsHorizontally(page);
  return [...(scrolls ? ['the page scrolls horizontally'] : []), ...(await overflowing(page))];
}

// Browser zoom shrinks the viewport in CSS px: 200 % of a 1280 × 800 window lays out like a
// 640 × 400 one. 320 px is WCAG 1.4.10's reflow width (1280 px at 400 %).
const ZOOM_200 = { width: 640, height: 400 };
const REFLOW_320 = { width: 320, height: 640 };

test.describe('REQ-A11Y-012 the options page reflows at 320 px and works at 200 % zoom', () => {
  for (const [label, viewport] of [
    ['320 px wide', REFLOW_320],
    ['200 % zoom', ZOOM_200],
  ] as const) {
    test(`nothing needs horizontal scrolling at ${label}`, { tag: '@REQ-A11Y-012' }, async ({
      context,
      extensionId,
    }) => {
      const { groupId, markId } = await seedGroups(context, extensionId);
      const page = await context.newPage();
      await page.setViewportSize(viewport);
      const found: Record<string, string[]> = {};
      for (const view of optionsViews(groupId, markId)) {
        await page.goto(`chrome-extension://${extensionId}/${view.path}`);
        await expect(view.ready(page)).toBeVisible();
        const problems = await reflowProblems(page);
        if (problems.length) found[view.name] = problems;
      }
      expect(found).toEqual({});
    });
  }

  test('a site group can be reordered and its mark opened at 200 % zoom', {
    tag: '@REQ-A11Y-012',
  }, async ({ context, extensionId }) => {
    const { groupId } = await seedGroups(context, extensionId);
    const page = await context.newPage();
    await page.setViewportSize(ZOOM_200);
    await page.goto(`chrome-extension://${extensionId}/options.html#/groups/${groupId}`);
    const sidebar = page.getByRole('complementary', { name: 'Site groups' });
    await expect(sidebar.getByRole('link')).toHaveText(['Staging', 'Production']);
    await sidebar.getByRole('button', { name: 'Move “Production” up' }).click();
    await expect(sidebar.getByRole('link')).toHaveText(['Production', 'Staging']);
    await page.getByRole('link', { name: 'Edit “Page · Ribbon”' }).click();
    await expect(page.getByRole('region', { name: 'Edit mark' })).toBeInViewport();
    expect(await reflowProblems(page)).toEqual([]);
  });
});

test.describe('REQ-A11Y-012 the popup scrolls vertically', () => {
  test('a long list of site groups scrolls, never sideways', { tag: '@REQ-A11Y-012' }, async ({
    context,
    extensionId,
    serviceWorker,
  }) => {
    for (let n = 1; n <= 8; n++) {
      await seedSiteGroup(context, extensionId, {
        name: `Production ${n}`,
        patterns: ['*://prod.sitemark.test/*'],
        marks: [aRibbonMark(`PROD ${n}`)],
      });
    }
    const { popup } = await openPopupFor(context, serviceWorker, extensionId, fixtureUrl('prod'));
    await popup.setViewportSize({ width: 360, height: 300 });
    const groups = popup.getByRole('list', { name: 'Site groups on this site' });
    const last = groups.getByRole('listitem').filter({ hasText: 'Production 8' });
    await expect(last).toBeVisible();
    await expect(last).not.toBeInViewport();
    await popup.mouse.move(180, 150);
    await popup.mouse.wheel(0, 2000);
    await expect(last).toBeInViewport();
    expect(await reflowProblems(popup)).toEqual([]);
  });
});
