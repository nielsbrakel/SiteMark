import { type RefObject, useEffect, useRef, useState } from 'react';
import type { SiteGroupId } from '@/core/ids';
import type { SiteGroup } from '@/core/model/schema';

export type MoveDirection = 'up' | 'down';

type Pending = {
  readonly id: SiteGroupId;
  readonly toIndex: number;
  readonly direction: MoveDirection;
};

const OPPOSITE: Readonly<Record<MoveDirection, MoveDirection>> = { up: 'down', down: 'up' };

/** The `data-move` value that marks a row's Move button, e.g. `grp-00000001:up`. */
export function moveButtonKey(id: SiteGroupId, direction: MoveDirection): string {
  return `${id}:${direction}`;
}

export type MoveFocus = {
  /** The list that holds the Move buttons. */
  readonly listRef: RefObject<HTMLUListElement | null>;
  /** Call after a Move click: focus follows the group once the list shows it at `toIndex`. */
  readonly moved: (pending: Pending) => void;
};

/**
 * Keeps keyboard focus on the Move button that was pressed after its row moves (REQ-A11Y-002), or on
 * the other one when the group reached an end and the pressed button is now disabled.
 */
export function useMoveFocus(groups: readonly SiteGroup[]): MoveFocus {
  const listRef = useRef<HTMLUListElement>(null);
  const [pending, setPending] = useState<Pending>();
  useEffect(() => {
    if (!pending || groups.findIndex((group) => group.id === pending.id) !== pending.toIndex)
      return;
    const button = (direction: MoveDirection) =>
      listRef.current?.querySelector<HTMLButtonElement>(
        `[data-move="${moveButtonKey(pending.id, direction)}"]`,
      );
    const preferred = button(pending.direction);
    (preferred?.disabled ? button(OPPOSITE[pending.direction]) : preferred)?.focus();
    setPending(undefined);
  }, [groups, pending]);
  return { listRef, moved: setPending };
}
