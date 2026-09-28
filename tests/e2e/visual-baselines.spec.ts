import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { fixtureUrl } from './hosts';
import { waitForMarker } from './marker';
import { openPopupFor } from './popup-page';
import { type MarkSeed, seedSiteGroup } from './state';

// Visual baselines (T-147): every effect and the UI in light, dark and forced colors. Pixels depend on
// fonts and rendering, so these run only inside the pinned Playwright image (tagged @visual, see
// playwright.config.ts), and the baselines are generated there too:
// (with the default E2E_PORT, since the popup shows the page's host and port):
//   pnpm build:e2e && docker run --rm --network host -v "$PWD":/work -w /work <image from ci.yml> \
//     node node_modules/@playwright/test/cli.js test --grep @visual --update-snapshots

const pageEffects: MarkSeed = {
  enabled: true,
  color: '#c93a2e',
  textColor: 'auto',
  target: { kind: 'page' },
  effects: {
    ribbon: { text: 'PROD', corner: 'top-right' },
    banner: { text: 'Production', edge: 'top', size: 'regular' },
    frame: { widthPx: 6 },
    tint: { opacityPct: 8 },
  },
};
const layeredEffects: MarkSeed = {
  enabled: true,
  color: '#1f6feb',
  textColor: 'auto',
  target: { kind: 'page' },
  effects: {
    ribbon: { text: 'TEST', corner: 'bottom-left' },
    banner: { text: 'Test environment', edge: 'bottom', size: 'compact' },
    stripes: { opacityPct: 12, area: 'edge' },
    watermark: { text: 'TEST', opacityPct: 8 },
  },
};
const element = (selector: string, effects: Record<string, unknown>): MarkSeed => ({
  enabled: true,
  color: '#7d5400',
  textColor: 'auto',
  label: selector,
  target: { kind: 'element', selector },
  effects,
});
const elementEffects = [
  element('h1', { outline: { widthPx: 3, style: 'dashed', pulse: false } }),
  element('table', { ribbon: { text: 'LIVE', corner: 'top-right' }, tint: { opacityPct: 12 } }),
  element('#delete', {
    stripes: { opacityPct: 30 },
    outline: { widthPx: 2, style: 'solid', pulse: false },
  }),
];

const schemes = [
  { name: 'light', media: { colorScheme: 'light' } },
  { name: 'dark', media: { colorScheme: 'dark' } },
  { name: 'forced-colors', media: { forcedColors: 'active' } },
] as const;

const snapshot = { animations: 'disabled', caret: 'hide' } as const;

async function marked(page: Page, path = ''): Promise<void> {
  await page.goto(fixtureUrl('prod', path));
  await page.bringToFront();
  await expect((await waitForMarker(page)).locator('.sm-view').first()).toBeVisible();
}

test.describe('page and element effects', () => {
  test.beforeEach(async ({ context, extensionId }) => {
    await seedSiteGroup(context, extensionId, {
      name: 'Production',
      patterns: ['*://prod.sitemark.test/*'],
      marks: [pageEffects, ...elementEffects],
    });
  });

  // The fixture site has no dark theme: light and forced colors cover the marks.
  for (const { name, media } of schemes.filter((scheme) => scheme.name !== 'dark')) {
    test(`ribbon, banner, frame, tint and element marks (${name}) @visual @REQ-A11Y-007`, async ({
      context,
    }) => {
      const page = await context.newPage();
      await page.emulateMedia(media);
      await marked(page);
      await expect(page).toHaveScreenshot(`page-effects-${name}.png`, snapshot);
    });
  }
});

test('stripes, watermark and a compact banner @visual @REQ-A11Y-007', async ({
  context,
  extensionId,
}) => {
  await seedSiteGroup(context, extensionId, {
    name: 'Test',
    patterns: ['*://prod.sitemark.test/*'],
    marks: [layeredEffects],
  });
  const page = await context.newPage();
  await marked(page);
  await expect(page).toHaveScreenshot('layered-effects.png', snapshot);
});

test.describe('the popup and the options page', () => {
  let groupId = '';

  test.beforeEach(async ({ context, extensionId }) => {
    const state = await seedSiteGroup(context, extensionId, {
      name: 'Production',
      patterns: ['*://prod.sitemark.test/*'],
      marks: [pageEffects, elementEffects[0] as MarkSeed],
    });
    groupId = state.siteGroups.at(-1)?.id ?? '';
  });

  for (const { name, media } of schemes) {
    test(`the popup on a marked page (${name}) @visual @REQ-THEME-001 @REQ-A11Y-007`, async ({
      context,
      extensionId,
      serviceWorker,
    }) => {
      const { popup } = await openPopupFor(context, serviceWorker, extensionId, fixtureUrl('prod'));
      await popup.setViewportSize({ width: 360, height: 560 });
      await popup.emulateMedia(media);
      await expect(popup.getByRole('button', { name: 'Pick element' })).toBeVisible();
      await expect(popup).toHaveScreenshot(`popup-${name}.png`, snapshot);
    });

    test(`the options page of a site group (${name}) @visual @REQ-THEME-001 @REQ-A11Y-007`, async ({
      context,
      extensionId,
    }) => {
      const page = await context.newPage();
      await page.emulateMedia(media);
      await page.goto(`chrome-extension://${extensionId}/options.html#/groups/${groupId}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page).toHaveScreenshot(`options-group-${name}.png`, {
        ...snapshot,
        fullPage: true,
      });
    });
  }
});
