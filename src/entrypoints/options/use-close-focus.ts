import { type RefObject, useEffect, useRef } from 'react';
import type { MarkId } from '@/core/ids';
import { isFocusLost } from './use-removal-focus';

/**
 * When the open mark's editor closes (its Close link, Back) and takes focus with it, focus goes to
 * that mark's Edit link in `listRef` (marked with `data-edit`), where the user opened it (WCAG 2.4.3).
 */
export function useCloseFocus(
  openMarkId: MarkId | undefined,
  listRef: RefObject<HTMLElement | null>,
): void {
  const previous = useRef(openMarkId);
  useEffect(() => {
    const closed = previous.current;
    previous.current = openMarkId;
    if (!closed || closed === openMarkId || !isFocusLost()) return;
    listRef.current?.querySelector<HTMLElement>(`[data-edit="${closed}"]`)?.focus();
  }, [openMarkId, listRef]);
}
