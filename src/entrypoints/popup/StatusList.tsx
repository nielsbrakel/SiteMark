import { type ReactNode, useState } from 'react';
import type { MarkId, SiteGroupId } from '@/core/ids';
import type { SiteGroup } from '@/core/model/schema';
import type { TabStatus } from '@/core/render/status';
import { t } from '@/lib/i18n/browser-source';
import { Card } from '@/ui/components/Card';
import { ColorChip } from '@/ui/components/ColorChip';
import { Switch } from '@/ui/components/Switch';
import { type CommandError, sendCommand } from '@/ui/hooks/use-command';
import { setGroupEnabled } from '@/ui/set-group-enabled';
import { ElementMarks } from './ElementMarks';
import { errorText } from './error-text';
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

function GroupItem({ group, isActive, status, onRepick }: GroupItemProps) {
  const [failure, setFailure] = useState<CommandError>();
  // A group has no color of its own: its first mark's color stands for it.
  const color = group.marks[0]?.color;
  const change = (enabled: boolean) => {
    setFailure(undefined);
    void setGroupEnabled(group, enabled, sendCommand).then((result) => {
      if (!result.ok) setFailure(result.error);
    });
  };
  return (
    <li className={styles.group}>
      <Switch
        spread
        label={
          <span className={styles.name}>
            {color && <ColorChip color={color} />}
            <span translate="no">{group.name}</span>
          </span>
        }
        onText={t('optionsGroupOn')}
        offText={t('optionsGroupOff')}
        checked={group.enabled}
        onChange={change}
        {...(!group.enabled && { description: t('popupGroupOff') })}
      />
      {isActive && status && <ElementMarks group={group} status={status} onRepick={onRepick} />}
      {failure && <p role="alert">{errorText(failure)}</p>}
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
