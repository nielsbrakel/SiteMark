import { browser } from 'wxt/browser';
import type { Badge, Logger } from '../app/ports';

/**
 * JavaScript can't read tokens.css, so the badge copies the light-theme `--sm-warning` token
 * (badge.test.ts keeps them equal). The badge sits on the browser's toolbar, not on a SiteMark
 * page, so it doesn't follow the theme; white text on it has 6.7:1 contrast.
 */
const COLORS = { background: '#7d5400', text: '#ffffff' } as const;

/** The badge colors: JavaScript can't read tokens.css, so the values are copied (and tested). */
export function badgeColors(): { readonly background: string; readonly text: string } {
  return COLORS;
}

/**
 * The Badge adapter over `browser.action`: a text and colors per tab (REQ-POP-007). The browser
 * clears a tab's badge when the tab closes. `setBadgeTextColor` is skipped where it is missing.
 */
export function createBadge(logger: Logger): Badge {
  return {
    setText: async (tabId, text) => {
      const { action } = browser;
      try {
        await Promise.all([
          action.setBadgeText({ tabId, text }),
          action.setBadgeBackgroundColor({ tabId, color: COLORS.background }),
          typeof action.setBadgeTextColor === 'function' &&
            action.setBadgeTextColor({ tabId, color: COLORS.text }),
        ]);
      } catch (error) {
        logger.warn('Could not set the toolbar badge', error);
      }
    },
  };
}
