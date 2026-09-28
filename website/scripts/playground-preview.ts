// The playground's no-JavaScript image (REQ-PLAY-003, T-234): the default preview of the built
// website's playground, in light and dark and in English and Dutch → website/public/playground.
// Runs with the screenshot generator (`pnpm web:screenshots`), against `vite preview`.
import { test } from '@playwright/test';
import { PLAYGROUND_PREVIEW_SIZE, playgroundPreviewFile } from '../src/content/playground-preview';
import { screenshotThemes } from '../src/content/screenshots';
import { websiteLocales } from '../src/i18n/locales';
import { toWebp, writePublic } from './image-files';

test.use({ deviceScaleFactor: 2, viewport: { width: 1280, height: 900 } });

for (const locale of websiteLocales()) {
  for (const theme of screenshotThemes()) {
    test(`captures the playground preview (${theme}, ${locale})`, async ({ page, context }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.goto(`/SiteMark/${locale === 'en' ? '' : `${locale}/`}playground/`);
      const preview = page.getByRole('figure');
      await preview.waitFor();
      // A fixed size, so the page can give the image its width and height (REQ-WEB-007).
      await preview.evaluate((figure, { width }) => {
        figure.style.setProperty('inline-size', `${width}px`);
      }, PLAYGROUND_PREVIEW_SIZE);
      await page.waitForTimeout(500);
      const box = await preview.boundingBox();
      if (!box) throw new Error('The playground preview is not on the page');
      const png = await page.screenshot({
        clip: { x: box.x, y: box.y, ...PLAYGROUND_PREVIEW_SIZE },
        omitBackground: true,
      });
      writePublic(playgroundPreviewFile(theme, locale, 'png'), png);
      writePublic(playgroundPreviewFile(theme, locale, 'webp'), await toWebp(context, png));
    });
  }
}
