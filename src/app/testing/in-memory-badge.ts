import { notImplemented } from '../../core/not-implemented';
import type { Badge, BadgeText } from '../ports';

export type InMemoryBadge = Badge & {
  /** The badge text of a tab (`''` when never set). */
  textOf(tabId: number): BadgeText;
};

export function createInMemoryBadge(): InMemoryBadge {
  return notImplemented();
}
