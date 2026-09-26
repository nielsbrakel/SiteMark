import type { ReactNode } from 'react';
import type { SiteGroupId } from '@/core/ids';
import type { SiteGroup } from '@/core/model/schema';
import styles from './GroupList.module.css';
import { groupHref } from './routes';

export type GroupListProps = {
  readonly groups: readonly SiteGroup[];
  /** The group open in the editor pane, marked as the current page. */
  readonly selectedId: SiteGroupId | undefined;
};

/** The site groups in priority order (REQ-OPT-001, REQ-GRP-004), each linking to its editor. */
export function GroupList({ groups, selectedId }: GroupListProps): ReactNode {
  return (
    <ul className={styles.list}>
      {groups.map((group) => (
        <li key={group.id} className={styles.row}>
          <a
            href={groupHref(group.id)}
            aria-current={group.id === selectedId ? 'page' : undefined}
            className={styles.link}
          >
            {group.name}
          </a>
        </li>
      ))}
    </ul>
  );
}
