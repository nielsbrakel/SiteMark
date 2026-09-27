import { type ReactNode, useState } from 'react';
import logo from '@/assets/logo.svg';
import type { SiteGroup, SiteMarkState } from '@/core/model/schema';
import type { OptionsRoute } from '@/core/options-route';
import { t } from '@/lib/i18n/browser-source';
import { Toast } from '@/ui/components/Toast';
import { GroupEditor } from './GroupEditor';
import styles from './Layout.module.css';
import type { Notify, OptionsToast } from './notify';
import { PageNav } from './PageNav';
import paneStyles from './Pane.module.css';
import { PlaceholderPane } from './PlaceholderPane';
import { selectedGroup } from './routes';
import { Sidebar } from './Sidebar';
import { useOpenNewGroup } from './use-open-new-group';
import { WelcomePane } from './WelcomePane';

export type LayoutProps = {
  readonly state: SiteMarkState;
  readonly route: OptionsRoute | undefined;
};

type PaneProps = {
  readonly route: OptionsRoute | undefined;
  readonly state: SiteMarkState;
  readonly group: SiteGroup | undefined;
  readonly notify: Notify;
  readonly onAdded: (revision: number) => void;
};

function GroupPane({ route, state, group, notify, onAdded }: PaneProps): ReactNode {
  if (!group) return <p className={`sm-well ${paneStyles.pane}`}>{t('optionsNoGroups')}</p>;
  const index = state.siteGroups.indexOf(group);
  const markId = route?.page === 'mark' ? route.markId : undefined;
  return (
    <GroupEditor
      key={group.id}
      group={group}
      index={index}
      notify={notify}
      onAdded={onAdded}
      markId={markId}
    />
  );
}

function Pane(props: PaneProps): ReactNode {
  switch (props.route?.page) {
    case 'settings':
      return <PlaceholderPane title={t('optionsSettings')} />;
    case 'data':
      return <PlaceholderPane title={t('optionsData')} />;
    case 'welcome':
      return <WelcomePane />;
    default:
      return <GroupPane {...props} />;
  }
}

/** The options page (design.md §5.2): header with page links, site group sidebar, editor pane. */
export function Layout({ state, route }: LayoutProps): ReactNode {
  const [toast, setToast] = useState<OptionsToast>();
  const openNewGroup = useOpenNewGroup(state);
  const group = selectedGroup(route, state.siteGroups);
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <img src={logo} alt="" width={32} height={32} />
        <h1>{t('optionsTitle')}</h1>
        <PageNav route={route} />
      </header>
      <Sidebar
        groups={state.siteGroups}
        selectedId={group?.id}
        onAdded={openNewGroup}
        notify={setToast}
      />
      <main className={styles.main}>
        <Pane route={route} state={state} group={group} notify={setToast} onAdded={openNewGroup} />
      </main>
      <Toast
        toast={toast}
        onDismiss={() => setToast(undefined)}
        dismissLabel={t('optionsDismiss')}
        {...(toast?.durationMs && { durationMs: toast.durationMs })}
      />
    </div>
  );
}
