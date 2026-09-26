/** The theme toggle's options: follow the OS, or force one theme (REQ-WEBUX-002). */
export type ThemeChoice = 'auto' | 'light' | 'dark';

/** The choice that <html data-theme> shows (the bootstrap set it from storage before paint). */
export function readThemeChoice(root: HTMLElement): ThemeChoice {
  const { theme } = root.dataset;
  return theme === 'light' || theme === 'dark' ? theme : 'auto';
}

/** Forces a theme on <html>, or lets the OS decide again (tokens.css reads data-theme). */
export function applyThemeChoice(root: HTMLElement, choice: ThemeChoice): void {
  if (choice === 'auto') delete root.dataset.theme;
  else root.dataset.theme = choice;
}
