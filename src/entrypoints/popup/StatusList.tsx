import type { ReactNode } from 'react';
import type { MarkId, SiteGroupId } from '@/core/ids';
import type { SiteGroup } from '@/core/model/schema';
import type { TabStatus } from '@/core/render/status';
import { t } from '@/lib/i18n/browser-source';
import { optionsPageUrl } from '@/platform/deep-links';
import { Card } from '@/ui/components/Card';
import { ColorChip } from '@/ui/components/ColorChip';
import { ElementMarks } from './ElementMarks';
import styles from './StatusList.module.css';

export type StatusListProps = {
  /** The groups whose patterns match the tab, by priority (`matchingGroups`, REQ-URL-006). */
  readonly groups: readonly SiteGroup[];
  /** The groups that render on the tab (`activeGroups`): only theirs have a mark status. */
  readonly activeIds: ReadonlySet<SiteGroupId>;
  /** The marker's report, when one runs in the tab. */
  readonly status: TabStatus | undefined;
  readonly onRepick: (markId: MarkId) => void;
};

type GroupItemProps = Omit<StatusListProps, 'groups' | 'activeIds'> & {
  readonly group: SiteGroup;
  readonly isActive: boolean;
};

/** "Disabled — enable in settings", linking to the group in the options page (REQ-POP-001). */
function DisabledNote({ group }: { readonly group: SiteGroup }) {
  const href = optionsPageUrl({ page: 'group', groupId: group.id });
  return (
    <span className={styles.note}>
      {t('popupGroupDisabled')}{' '}
      <a href={href} target="_blank" rel="noreferrer">
        {t('popupEnableInSettings')}
      </a>
    </span>
  );
}

function GroupItem({ group, isActive, status, onRepick }: GroupItemProps) {
  // A group has no color of its own: its first mark's color stands for it.
  const color = group.marks[0]?.color;
  return (
    <li className={styles.group}>
      {color && <ColorChip color={color} />}
      <span className={styles.name} translate="no">
        {group.name}
      </span>{' '}
      {!group.enabled && <DisabledNote group={group} />}
      {isActive && status && <ElementMarks group={group} status={status} onRepick={onRepick} />}
    </li>
  );
}

/** The site groups that match the tab, enabled or not (REQ-POP-001, design.md §5.1 A). */
export function StatusList({ groups, activeIds, ...rest }: StatusListProps): ReactNode {
  return (
    <Card>
      <ul className={styles.list} aria-label={t('popupSiteGroups')}>
        {groups.map((group) => (
          <GroupItem key={group.id} group={group} isActive={activeIds.has(group.id)} {...rest} />
        ))}
      </ul>
    </Card>
  );
}
