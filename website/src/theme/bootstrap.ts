// The only website file that may use localStorage (D-250, REQ-WEB-004): Biome allows it here alone.
import type { ThemeChoice } from './theme-choice';

/** The website's only web storage key (REQ-WEB-004). */
const THEME_KEY = 'sitemark-website:theme';

/**
 * Runs inline in <head> before first paint (REQ-WEBUX-002): marks JavaScript as available (the theme
 * toggle shows) and applies a stored light or dark theme. Blocked storage means the OS decides.
 * It is serialized with toString(), so it must stay self-contained: no imports, no outer names
 * (hence the key is written out), no comments inside.
 */
export function themeBootstrap(root: HTMLElement): void {
  root.dataset.js = '';
  try {
    const theme = localStorage.getItem('sitemark-website:theme');
    if (theme === 'light' || theme === 'dark') root.dataset.theme = theme;
  } catch {}
}

/** The inline script, whose SHA-256 the CSP pins (REQ-WEB-005). */
export function bootstrapScript(): string {
  return `(${themeBootstrap.toString()})(document.documentElement)`;
}

/** Remembers the toggle's choice under the website's only storage key; Auto forgets it. */
export function saveThemeChoice(choice: ThemeChoice): void {
  try {
    if (choice === 'auto') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {
    // Blocked storage: the choice lasts until the visitor leaves the page.
  }
}
