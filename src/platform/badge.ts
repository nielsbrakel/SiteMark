import { browser } from 'wxt/browser';
import type { Badge, BadgeState, Logger } from '../app/ports';

/** The toolbar icon sizes: 16 px, 32 px for high-DPI screens, and 48 px for the extensions page. */
const SIZES = [16, 32, 48] as const;

/**
 * The icon files of a state by size, as `action.setIcon` takes them: `icon/<size>.png` plain, and
 * `icon/<state>-<size>.png` with the sticker (`pnpm icons` renders them, REQ-POP-010).
 */
export function badgeIconPaths(state: BadgeState): Record<number, string> {
  const name = (size: number) => (state === 'none' ? `${size}` : `${state}-${size}`);
  return Object.fromEntries(SIZES.map((size) => [size, `icon/${name(size)}.png`]));
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
