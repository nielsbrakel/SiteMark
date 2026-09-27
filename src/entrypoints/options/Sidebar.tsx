import { type ReactNode, useId } from 'react';
import type { SiteGroupId } from '@/core/ids';
import type { SiteGroup } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { AddGroupForm } from './AddGroupForm';
import { GroupList } from './GroupList';
import styles from './Layout.module.css';

export type SidebarProps = {
  readonly groups: readonly SiteGroup[];
  readonly selectedId: SiteGroupId | undefined;
  readonly onAdded: (revision: number) => void;
};

/** The site group list with its Add form (design.md §5.2). */
export function Sidebar({ groups, selectedId, onAdded }: SidebarProps): ReactNode {
  const headingId = useId();
  return (
    <aside aria-labelledby={headingId} className={styles.sidebar}>
      <h2 id={headingId}>{t('optionsSiteGroups')}</h2>
      <GroupList groups={groups} selectedId={selectedId} />
      <AddGroupForm onAdded={onAdded} />
    </aside>
  );
}
