import { type DragEvent, useRef } from 'react';
import type { SiteGroupId } from '@/core/ids';
import type { SiteGroup } from '@/core/model/schema';

/** The native drag and drop props of one row (no library, REQ-GRP-004). */
export type RowDragProps = {
  readonly draggable: true;
  readonly onDragStart: (event: DragEvent) => void;
  readonly onDragOver: (event: DragEvent) => void;
  readonly onDrop: (event: DragEvent) => void;
  readonly onDragEnd: () => void;
};

/**
 * Drag a site group onto another row to move it there. Only drags that started in this list are
 * accepted; the group being dragged is remembered here, not read from the drop's data.
 */
export function useGroupDrag(
  onMove: (id: SiteGroupId, toIndex: number) => void,
): (group: SiteGroup, index: number) => RowDragProps {
  const dragged = useRef<SiteGroupId>(undefined);
  return (group, index) => ({
    draggable: true,
    onDragStart: (event) => {
      dragged.current = group.id;
      // Firefox only starts a drag that carries data.
      event.dataTransfer?.setData('text/plain', group.name);
    },
    onDragOver: (event) => {
      if (dragged.current) event.preventDefault();
    },
    onDrop: (event) => {
      const id = dragged.current;
      dragged.current = undefined;
      if (!id) return;
      event.preventDefault();
      if (id !== group.id) onMove(id, index);
    },
    onDragEnd: () => {
      dragged.current = undefined;
    },
  });
}
