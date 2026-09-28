import { type ReactNode, useState } from 'react';
import type { SiteGroupId } from '@/core/ids';
import type { SiteGroup } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { commandErrorText } from './command-error';
import styles from './GroupList.module.css';
import { GroupRow } from './GroupRow';
import type { Notify } from './notify';
import { sendTracked } from './save-status';
import { useGroupDrag } from './use-group-drag';
import { useMoveFocus } from './use-move-focus';

export type GroupListProps = {
  readonly groups: readonly SiteGroup[];
  /** The group open in the editor pane, marked as the current page. */
  readonly selectedId: SiteGroupId | undefined;
  readonly notify: Notify;
};

/**
 * The site groups in priority order (REQ-OPT-001, REQ-GRP-004), each linking to its editor. They
 * are reordered by drag and drop or, from the keyboard, with Move up/down (REQ-A11Y-010). The new
 * position is announced politely (WCAG 4.1.3).
 */
export function GroupList({ groups, selectedId, notify }: GroupListProps): ReactNode {
  const focus = useMoveFocus(groups);
  const [announcement, setAnnouncement] = useState('');
  const move = async (id: SiteGroupId, toIndex: number) => {
    const name = groups.find((group) => group.id === id)?.name ?? '';
    const result = await sendTracked({ type: 'moveSiteGroup', id, toIndex });
    if (!result.ok) return notify({ text: commandErrorText(result.error) });
    const position = [String(toIndex + 1), String(groups.length)];
    setAnnouncement(t('optionsMovedTo', [name, ...position]));
  };
  const dragProps = useGroupDrag((id, toIndex) => void move(id, toIndex));
  return (
    <>
      <ul ref={focus.listRef} className={styles.list}>
        {groups.map((group, index) => (
          <GroupRow
            key={group.id}
            group={group}
            isSelected={group.id === selectedId}
            isFirst={index === 0}
            isLast={index === groups.length - 1}
            drag={dragProps(group, index)}
            onMove={(direction) => {
              const toIndex = direction === 'up' ? index - 1 : index + 1;
              focus.moved({ id: group.id, toIndex, direction });
              void move(group.id, toIndex);
            }}
          />
        ))}
      </ul>
      <p aria-live="polite" className="sm-visually-hidden">
        {announcement}
      </p>
    </>
  );
}
