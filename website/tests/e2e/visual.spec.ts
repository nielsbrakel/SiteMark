import { expect, routeCases, test } from './fixtures';

// Visual baselines (T-240): every route in light and dark, English and Dutch. Pixels depend on fonts
// and rendering, so these run only inside the pinned Playwright image (tagged @visual, see
// playwright.config.ts), and the baselines are generated there too:
//   pnpm web:build && docker run --rm --network host -v "$PWD":/work -w /work <image from ci.yml> \
//     node node_modules/@playwright/test/cli.js test --config website/playwright.config.ts \
//     --grep @visual --update-snapshots

const snapshot = { animations: 'disabled', caret: 'hide', fullPage: true } as const;
const fileName = (name: string) => name.replace(/[^a-z0-9]+/gi, '-').replace(/-$/, '');

test.describe('REQ-WEBUX-006 every route looks as its baseline in light and dark', () => {
  for (const colorScheme of ['light', 'dark'] as const) {
    for (const { name, path } of routeCases()) {
      test(`${name} in ${colorScheme}`, { tag: ['@visual', '@REQ-WEBUX-006'] }, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme });
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveScreenshot(`${fileName(name)}-${colorScheme}.png`, snapshot);
      });
    }
  }
});
