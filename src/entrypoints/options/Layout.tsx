import { type ReactNode, useId } from 'react';
import logo from '@/assets/logo.svg';
import type { SiteGroup, SiteMarkState } from '@/core/model/schema';
import type { OptionsRoute } from '@/core/options-route';
import { t } from '@/lib/i18n/browser-source';
import { GroupEditor } from './GroupEditor';
import { GroupList } from './GroupList';
import styles from './Layout.module.css';
import { PageNav } from './PageNav';
import paneStyles from './Pane.module.css';
import { PlaceholderPane } from './PlaceholderPane';
import { selectedGroup } from './routes';
import { WelcomePane } from './WelcomePane';

export type LayoutProps = {
  readonly state: SiteMarkState;
  readonly route: OptionsRoute | undefined;
};

function GroupPane({ group }: { readonly group: SiteGroup | undefined }): ReactNode {
  if (!group) return <p className={`sm-well ${paneStyles.pane}`}>{t('optionsNoGroups')}</p>;
  return <GroupEditor key={group.id} group={group} />;
}

function Pane({
  route,
  group,
}: {
  readonly route: OptionsRoute | undefined;
  readonly group: SiteGroup | undefined;
}): ReactNode {
  switch (route?.page) {
    case 'settings':
      return <PlaceholderPane title={t('optionsSettings')} />;
    case 'data':
      return <PlaceholderPane title={t('optionsData')} />;
    case 'welcome':
      return <WelcomePane />;
    default:
      return <GroupPane group={group} />;
  }
}

/** The options page (design.md §5.2): header with page links, site group sidebar, editor pane. */
export function Layout({ state, route }: LayoutProps): ReactNode {
  const sidebarId = useId();
  const group = selectedGroup(route, state.siteGroups);
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <img src={logo} alt="" width={32} height={32} />
        <h1>{t('optionsTitle')}</h1>
        <PageNav route={route} />
      </header>
      <aside aria-labelledby={sidebarId} className={styles.sidebar}>
        <h2 id={sidebarId}>{t('optionsSiteGroups')}</h2>
        <GroupList groups={state.siteGroups} selectedId={group?.id} />
      </aside>
      <main className={styles.main}>
        <Pane route={route} group={group} />
      </main>
    </div>
  );
}
