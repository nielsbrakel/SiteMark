import type { Badge, BadgeText } from '../ports';

export type InMemoryBadge = Badge & {
  /** The badge text of a tab (`''` when never set). */
  textOf(tabId: number): BadgeText;
};

export function createInMemoryBadge(): InMemoryBadge {
  const texts = new Map<number, BadgeText>();
  return {
    setText: async (tabId, text) => void texts.set(tabId, text),
    textOf: (tabId) => texts.get(tabId) ?? '',
  };
}
