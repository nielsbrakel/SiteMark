import { assertNever } from '../../core/result';
import { elementAt } from './candidate';

// Keyboard picking (REQ-PICK-002): ↑ parent, ↓ first child, ← → siblings, over the light DOM.
// Elements without a box (display:none, <script>) and SiteMark's hosts are skipped; a move that
// has nowhere to go stays put, and ↑ never leaves <body>.

/** ↑ parent, ↓ first child, ← → siblings (REQ-PICK-002). */
export type NavKey = 'up' | 'down' | 'left' | 'right';

const SKIPPED = new Set([
  'script',
  'style',
  'template',
  'noscript',
  'sitemark-root',
  'sitemark-picker',
]);

function isPickable(element: Element): boolean {
  return !SKIPPED.has(element.localName) && element.getClientRects().length > 0;
}

function parentOf(from: Element): Element {
  const parent = from.parentElement;
  const atTop = from === document.body || parent === null || parent === document.documentElement;
  return atTop ? from : parent;
}

function firstChildOf(from: Element): Element {
  return [...from.children].find(isPickable) ?? from;
}

function siblingOf(from: Element, step: 'previousElementSibling' | 'nextElementSibling'): Element {
  let next = from[step];
  while (next && !isPickable(next)) next = next[step];
  return next ?? from;
}

/** The candidate a key moves to from `from`, or `from` itself when there is nowhere to go. */
export function navigate(from: Element, key: NavKey): Element {
  switch (key) {
    case 'up':
      return parentOf(from);
    case 'down':
      return firstChildOf(from);
    case 'left':
      return siblingOf(from, 'previousElementSibling');
    case 'right':
      return siblingOf(from, 'nextElementSibling');
    default:
      return assertNever(key);
  }
}

/** Where keyboard picking starts: the focused page element, or the element in the viewport center. */
export function startElement(): Element | undefined {
  const active = document.activeElement;
  const isPageFocus = active && active !== document.body && active !== document.documentElement;
  if (isPageFocus && isPickable(active)) return active;
  return elementAt(innerWidth / 2, innerHeight / 2);
}
