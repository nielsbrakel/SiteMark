import type { Theme } from '@/core/model/schema';

/** The choice that <html data-theme> shows (the bootstrap set it from storage before paint). */
export function readThemeChoice(root: HTMLElement): Theme {
  const { theme } = root.dataset;
  return theme === 'light' || theme === 'dark' ? theme : 'system';
}

/** Forces a theme on <html>, or lets the OS decide again (tokens.css reads data-theme). */
export function applyThemeChoice(root: HTMLElement, choice: Theme): void {
  if (choice === 'system') delete root.dataset.theme;
  else root.dataset.theme = choice;
}

/**
 * Keeps the browser toolbar colour (<meta name="theme-color">) on the chosen theme. The tags follow the
 * OS through their media query; a forced theme makes both show that theme's colour, System restores each.
 */
export function applyThemeColor(choice: Theme): void {
  const tags = [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')];
  const forced = tags.find((tag) => tag.getAttribute('media')?.includes(choice));
  for (const tag of tags) tag.content = (forced ?? tag).dataset.color ?? tag.content;
}
