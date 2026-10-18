// The only website file that may use localStorage (D-250, REQ-WEB-004): Biome allows it here alone.
import type { Theme } from '@/core/model/schema';

/** The website's only web storage key (REQ-WEB-004). */
const THEME_KEY = 'sitemark-website:theme';

/**
 * Runs inline in <head> before first paint (REQ-WEBUX-002): marks JavaScript as available (the theme
 * toggle shows), applies a stored light or dark theme (blocked storage means the OS decides) and
 * marks Firefox, Edge or Safari as <html data-browser>, so the install button of the visitor's store stands out.
 * It is serialized with toString(), so it must stay self-contained: no imports, no outer names
 * (hence the key is written out), no comments inside.
 */
export function themeBootstrap(root: HTMLElement): void {
  root.dataset.js = '';
  try {
    const theme = localStorage.getItem('sitemark-website:theme');
    if (theme === 'light' || theme === 'dark') root.dataset.theme = theme;
  } catch {}
  try {
    const agent = navigator.userAgent;
    if (
      /iP(hone|ad|od)/.test(agent) ||
      (/Safari/.test(agent) && !/Chrom|Firefox|Android/.test(agent))
    ) {
      root.dataset.browser = 'safari';
    } else if (/Edg/.test(agent)) root.dataset.browser = 'edge';
    else if (/Firefox/.test(agent)) root.dataset.browser = 'firefox';
  } catch {}
}

/** The inline script, whose SHA-256 the CSP pins (REQ-WEB-005). */
export function bootstrapScript(): string {
  return `(${themeBootstrap.toString()})(document.documentElement)`;
}

/** Remembers the toggle's choice under the website's only storage key; System forgets it. */
export function saveThemeChoice(choice: Theme): void {
  try {
    if (choice === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {
    // Blocked storage: the choice lasts until the visitor leaves the page.
  }
}
