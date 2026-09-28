import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SCREENSHOT_SIZE,
  screenshotFile,
  screenshotScenes,
  screenshotThemes,
} from '../../src/content/screenshots';
import { websiteLocales } from '../../src/i18n/locales';
import { pngSize, webpSize } from '../images';

// The generated screenshots (D-251): `pnpm web:screenshots` writes them into website/public, and
// the website and the store listings (T-152) use the same files.
const publicDir = path.resolve('website/public');
const KB = 1024;

const cases = screenshotScenes().flatMap((scene) =>
  screenshotThemes().flatMap((theme) =>
    websiteLocales().map((locale) => ({ scene, theme, locale })),
  ),
);

function read(file: string): Buffer | undefined {
  const full = path.join(publicDir, file);
  return existsSync(full) ? readFileSync(full) : undefined;
}

describe('REQ-PAGE-008 screenshots of every scene in light and dark, in English and Dutch', () => {
  it('shows the marked page, the popup and the mark editor, in light and dark', () => {
    expect(screenshotScenes()).toEqual(['marked-page', 'popup', 'options']);
    expect(screenshotThemes()).toEqual(['light', 'dark']);
    expect(cases).toHaveLength(12);
  });

  it.each(cases)('$scene ($theme, $locale) is a 1280 × 800 WebP of ≤ 200 KB', (shot) => {
    const file = screenshotFile(shot.scene, shot.theme, shot.locale, 'webp');
    expect(file).toBe(`screenshots/${shot.scene}-${shot.theme}-${shot.locale}.webp`);
    const bytes = read(file);
    expect(bytes, `${file} was generated`).toBeDefined();
    expect(webpSize(bytes ?? Buffer.alloc(0))).toEqual(SCREENSHOT_SIZE);
    expect(bytes?.length).toBeLessThanOrEqual(200 * KB);
  });

  it.each(cases)(
    '$scene ($theme, $locale) has a 1280 × 800 PNG for fallback and stores',
    (shot) => {
      const file = screenshotFile(shot.scene, shot.theme, shot.locale, 'png');
      const bytes = read(file);
      expect(bytes, `${file} was generated`).toBeDefined();
      expect(pngSize(bytes ?? Buffer.alloc(0))).toEqual({ width: 1280, height: 800 });
      expect(bytes?.length).toBeLessThanOrEqual(200 * KB);
    },
  );

  it('keeps no stale screenshots next to the generated ones', () => {
    const dir = path.join(publicDir, 'screenshots');
    const present = existsSync(dir) ? readdirSync(dir).sort() : [];
    const expected = cases
      .flatMap((shot) =>
        (['webp', 'png'] as const).map((format) =>
          screenshotFile(shot.scene, shot.theme, shot.locale, format),
        ),
      )
      .map((file) => path.basename(file))
      .sort();
    expect(present).toEqual(expected);
  });
});
