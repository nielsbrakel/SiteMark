import { createRateLimiter } from '../marker/rate-limit';
import type { NavKey } from './keyboard-nav';

// Keyboard and focus of the glass pane (REQ-PICK-002, REQ-PICK-003, REQ-A11Y-002, REQ-A11Y-011).
// The pane holds the focus while the picker runs, so keys go to SiteMark and never to the page
// element that had focus. Every key is stopped at the pane; only trusted keys count (REQ-SEC-005).

/** The keys the picker acts on: navigation, Enter (select) and Esc (cancel). */
export type PaneKey = NavKey | 'enter' | 'escape';

const KEYS: Readonly<Record<string, PaneKey>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Enter: 'enter',
  Escape: 'escape',
};

/** A page that keeps taking the focus back can't make the pane spin: 10 re-takes per second. */
const REFOCUS_MAX = 10;
const REFOCUS_WINDOW_MS = 1000;

function keyOf(event: KeyboardEvent): PaneKey | undefined {
  return event.isTrusted && Object.hasOwn(KEYS, event.key) ? KEYS[event.key] : undefined;
}

function stop(event: Event): void {
  event.stopPropagation();
  // Tab can't leave the pane, and no key does anything in the page behind it.
  event.preventDefault();
}

/** Reports the picker's keys and keeps every key (Tab included) from the page. */
export function listenForKeys(pane: HTMLElement, onKey: (key: PaneKey) => void): void {
  pane.addEventListener('keydown', (event) => {
    stop(event);
    const key = keyOf(event);
    if (key) onKey(key);
  });
  pane.addEventListener('keyup', stop);
  pane.addEventListener('keypress', stop);
}

function focusable(element: Element | null): { focus(options?: FocusOptions): void } | undefined {
  const page = document.body;
  if (!element || element === page || !element.isConnected || !('focus' in element)) return;
  return element as HTMLElement;
}

/**
 * Moves the focus onto the pane and takes it back when the page moves it elsewhere (anywhere in
 * the picker's own shadow root is fine). The returned function gives the focus back to the page
 * element that had it (REQ-A11Y-011).
 */
export function captureFocus(pane: HTMLElement, own: HTMLElement): () => void {
  const previous = focusable(document.activeElement);
  const limiter = createRateLimiter(REFOCUS_MAX, REFOCUS_WINDOW_MS, Date.now);
  let captured = true;
  const refocus = () => {
    if (captured && limiter.tryTake()) pane.focus({ preventScroll: true });
  };
  pane.addEventListener('focusout', (event) => {
    const next = event.relatedTarget;
    if (!(next instanceof Node && own.contains(next))) queueMicrotask(refocus);
  });
  pane.tabIndex = -1;
  pane.focus({ preventScroll: true });
  return () => {
    captured = false;
    previous?.focus({ preventScroll: true });
  };
}
