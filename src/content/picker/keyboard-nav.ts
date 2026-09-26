import { notImplemented } from '../../core/not-implemented';

/** ↑ parent, ↓ first child, ← → siblings (REQ-PICK-002). */
export type NavKey = 'up' | 'down' | 'left' | 'right';

/** The candidate a key moves to from `from`, or `from` itself when there is nowhere to go. */
export function navigate(_from: Element, _key: NavKey): Element {
  return notImplemented();
}

/** Where keyboard picking starts: the focused page element, or the element in the viewport center. */
export function startElement(): Element | undefined {
  return notImplemented();
}
