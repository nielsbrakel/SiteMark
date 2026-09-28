import { type RefObject, useCallback, useEffect, useRef } from 'react';
import { isFocusLost } from './use-removal-focus';

export type PaneFocus = {
  /** The main landmark that holds the editor pane. */
  readonly mainRef: RefObject<HTMLElement | null>;
  /** Focuses the pane's heading (an `h2` with tabIndex -1). */
  readonly focusPane: () => void;
};

/**
 * Keeps focus on the page when the editor pane is replaced under it (WCAG 2.4.3): deleting a site
 * group, or Undo putting it back, swaps the pane and removes the focused element with it. Then the
 * new pane's heading takes focus. The first pane of a page load never takes focus.
 */
export function usePaneFocus(paneKey: string): PaneFocus {
  const mainRef = useRef<HTMLElement>(null);
  const shown = useRef(paneKey);
  const focusPane = useCallback(() => {
    mainRef.current?.querySelector<HTMLElement>('h2')?.focus();
  }, []);
  useEffect(() => {
    if (shown.current === paneKey) return;
    shown.current = paneKey;
    if (isFocusLost()) focusPane();
  }, [paneKey, focusPane]);
  return { mainRef, focusPane };
}
