import type { ReactNode } from 'react';
import type { SiteGroup } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { IconButton } from '@/ui/components/IconButton';
import { ArrowDownIcon, ArrowUpIcon } from '@/ui/components/icons';
import { groupHref } from '../routes';
import { type MoveDirection, moveButtonKey } from '../use-move-focus';
import styles from './GroupList.module.css';
import type { RowDragProps } from './use-group-drag';

export type GroupRowProps = {
  readonly group: SiteGroup;
  readonly isSelected: boolean;
  readonly isNew: boolean;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly drag: RowDragProps;
  readonly onMove: (direction: MoveDirection) => void;
};

/** One site group in the list: its link, On/Off, and Move up/down (REQ-GRP-004, REQ-A11Y-010). */
export function GroupRow({
  group,
  isSelected,
  isNew,
  isFirst,
  isLast,
  drag,
  onMove,
}: GroupRowProps): ReactNode {
  return (
    <li className={styles.row} data-new={isNew || undefined} {...drag}>
      <a
        href={groupHref(group.id)}
        aria-current={isSelected ? 'page' : undefined}
        className={`${styles.link} sm-pick`}
        translate="no"
      >
        {group.name}
      </a>
      <span className={styles.state} data-on={group.enabled}>
        {t(group.enabled ? 'optionsGroupOn' : 'optionsGroupOff')}
      </span>
      <IconButton
        data-move={moveButtonKey(group.id, 'up')}
        label={t('optionsMoveUp', group.name)}
        icon={<ArrowUpIcon />}
        disabled={isFirst}
        onClick={() => onMove('up')}
      />
      <IconButton
        data-move={moveButtonKey(group.id, 'down')}
        label={t('optionsMoveDown', group.name)}
        icon={<ArrowDownIcon />}
        disabled={isLast}
        onClick={() => onMove('down')}
      />
    </li>
  );
}
