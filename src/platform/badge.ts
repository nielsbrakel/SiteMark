import { browser } from 'wxt/browser';
import type { Badge, BadgeState, Logger } from '../app/ports';
import { notImplemented } from '../core/not-implemented';

/**
 * The icon files of a state by size, as `action.setIcon` takes them: `icon/<size>.png` plain, and
 * `icon/<state>-<size>.png` with the sticker (`pnpm icons` renders them, REQ-POP-010).
 */
export function badgeIconPaths(_state: BadgeState): Record<number, string> {
  return notImplemented();
}

/**
 * The Badge adapter over `browser.action`: the toolbar icon of one tab, with the sticker of its state
 * (REQ-POP-010). The browser resets a tab's icon when the tab closes.
 */
export function createBadge(logger: Logger): Badge {
  return {
    setState: async (tabId, state) => {
      try {
        await browser.action.setIcon({ tabId, path: badgeIconPaths(state) });
      } catch (error) {
        logger.warn('Could not set the toolbar icon', error);
      }
    },
  };
}
