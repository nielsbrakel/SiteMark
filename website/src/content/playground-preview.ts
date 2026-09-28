import type { Locale } from '../i18n/locales';
import type { ScreenshotFormat, ScreenshotTheme } from './screenshots';

/**
 * The playground's default preview as an image (REQ-PLAY-003), for visitors without JavaScript.
 * `pnpm web:screenshots` captures it from the built website at 2× density.
 */
export const PLAYGROUND_PREVIEW_SIZE = { width: 560, height: 300 } as const;

/** The file below `website/public/`, e.g. `playground/preview-dark-nl.webp`. */
export function playgroundPreviewFile(
  theme: ScreenshotTheme,
  locale: Locale,
  format: ScreenshotFormat,
): string {
  return `playground/preview-${theme}-${locale}.${format}`;
}
