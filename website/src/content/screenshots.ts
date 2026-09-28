import type { Locale } from '../i18n/locales';

/** What a screenshot shows (D-251): a marked page, the popup on it, the mark editor. */
export type ScreenshotScene = 'marked-page' | 'popup' | 'options';
export type ScreenshotTheme = 'light' | 'dark';
export type ScreenshotFormat = 'webp' | 'png';

/** Every screenshot is 1280 × 800: the store size, shown at 2× density on the website. */
export const SCREENSHOT_SIZE = { width: 1280, height: 800 } as const;

const SCENES: readonly ScreenshotScene[] = ['marked-page', 'popup', 'options'];
const THEMES: readonly ScreenshotTheme[] = ['light', 'dark'];

/** The scenes in the order the website and the stores show them. */
export function screenshotScenes(): readonly ScreenshotScene[] {
  return SCENES;
}

export function screenshotThemes(): readonly ScreenshotTheme[] {
  return THEMES;
}

/**
 * The file of one screenshot below `website/public/`, e.g. `screenshots/popup-dark-nl.webp`. The
 * website shows the WebP (PNG as the fallback); the store listings take the PNGs (T-152).
 */
export function screenshotFile(
  scene: ScreenshotScene,
  theme: ScreenshotTheme,
  locale: Locale,
  format: ScreenshotFormat,
): string {
  return `screenshots/${scene}-${theme}-${locale}.${format}`;
}
