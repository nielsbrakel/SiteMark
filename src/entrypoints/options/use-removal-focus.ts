import { type RefObject, useEffect, useRef, useState } from 'react';

type Removed = { readonly id: string; readonly index: number };

/** True when the focused element went away and focus fell back to the page (WCAG 2.4.3). */
export function isFocusLost(): boolean {
  return document.activeElement === null || document.activeElement === document.body;
}

export type RemovalFocus = {
  /** The list that holds the Remove buttons (each marked with `data-remove`). */
  readonly listRef: RefObject<HTMLUListElement | null>;
  /** Call once a row's removal was committed: focus moves on when the list no longer shows it. */
  readonly removed: (removed: Removed) => void;
};

/**
 * Keeps keyboard focus in a list after a row's Remove (WCAG 2.4.3): on the Remove button of the row
 * that took its place, else of the row before it, else on the element `fallbackId` (the list's
 * heading, focusable with tabIndex -1). Nothing moves unless focus went away with the removed row.
 */
export function useRemovalFocus(ids: readonly string[], fallbackId: string): RemovalFocus {
  const listRef = useRef<HTMLUListElement>(null);
  const [pending, setPending] = useState<Removed>();
  useEffect(() => {
    if (!pending || ids.includes(pending.id)) return;
    setPending(undefined);
    if (!isFocusLost()) return;
    const buttons = listRef.current?.querySelectorAll<HTMLElement>('[data-remove]') ?? [];
    const next =
      buttons[Math.min(pending.index, buttons.length - 1)] ?? document.getElementById(fallbackId);
    next?.focus();
  }, [ids, pending, fallbackId]);
  return { listRef, removed: setPending };
}
