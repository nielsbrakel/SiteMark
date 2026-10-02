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
