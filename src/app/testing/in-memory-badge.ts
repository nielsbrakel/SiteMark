import type { Badge, BadgeState } from '../ports';

export type InMemoryBadge = Badge & {
  /** The badge state of a tab (`'none'` when never set). */
  stateOf(tabId: number): BadgeState;
};

export function createInMemoryBadge(): InMemoryBadge {
  const states = new Map<number, BadgeState>();
  return {
    setState: async (tabId, state) => void states.set(tabId, state),
    stateOf: (tabId) => states.get(tabId) ?? 'none',
  };
}
