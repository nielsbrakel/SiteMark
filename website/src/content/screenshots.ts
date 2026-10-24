/** The themes of the generated images (D-251): the playground preview and the store screenshots. */
export type ScreenshotTheme = 'light' | 'dark';
export type ScreenshotFormat = 'webp' | 'png';

/** The store screenshot size, the viewport the demo page is opened at. */
export const SCREENSHOT_SIZE = { width: 1280, height: 800 } as const;

const THEMES: readonly ScreenshotTheme[] = ['light', 'dark'];

export function screenshotThemes(): readonly ScreenshotTheme[] {
  return THEMES;
}
