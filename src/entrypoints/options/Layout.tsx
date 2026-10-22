import { type ReactNode, useMemo, useState } from 'react';
import type { SiteGroup, SiteMarkState } from '@/core/model/schema';
import type { OptionsRoute } from '@/core/options-route';
import { t } from '@/lib/i18n/browser-source';
import { repositoryUrl } from '@/lib/site-links';
import { GitHubIcon } from '@/ui/components/icons';
import { Toast } from '@/ui/components/Toast';
import { Wordmark } from '@/ui/components/Wordmark';
import { SiteLinks } from '@/ui/SiteLinks';
import { DataPane } from './data/DataPane';
import { GroupEditor } from './groups/GroupEditor';
import { useOpenNewGroup } from './groups/use-open-new-group';
import styles from './Layout.module.css';
import type { Notify, OptionsToast } from './notify';
import { PageNav } from './PageNav';
import paneStyles from './Pane.module.css';
import { createOfferRevoke, RevokeContext } from './patterns/revoke-prompt';
import { selectedGroup } from './routes';
import { SaveStatusText } from './SaveStatusText';
import { Sidebar } from './Sidebar';
import { LanguageControl } from './settings/LanguageControl';
import { SettingsPane } from './settings/SettingsPane';
import { ThemeControl } from './settings/ThemeControl';
import { UnreadableBanner } from './UnreadableBanner';
import { useDocumentTitle } from './use-document-title';
import { usePaneFocus } from './use-pane-focus';
import { useUnreadable } from './use-unreadable';
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
      return <SettingsPane state={props.state} />;
    case 'data':
      return <DataPane state={props.state} notify={props.notify} />;
    case 'welcome':
      return <WelcomePane />;
    default:
      return <GroupPane {...props} />;
  }
}

/** The options page (design.md §5.2): header with page links, site group sidebar, editor pane. */
export function Layout({ state, route }: LayoutProps): ReactNode {
  const [toast, setToast] = useState<OptionsToast>();
  const offerRevoke = useMemo(() => createOfferRevoke(setToast), []);
  const openNewGroup = useOpenNewGroup(state);
  const isUnreadable = useUnreadable();
  const group = selectedGroup(route, state.siteGroups);
  const pane = usePaneFocus(group?.id ?? route?.page ?? '');
  useDocumentTitle(route, group);
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Wordmark />
        <h1 className="sm-visually-hidden">{t('optionsTitle')}</h1>
        <SaveStatusText />
        <PageNav route={route} />
        <div className={styles.tools}>
          <LanguageControl language={state.settings.language ?? 'auto'} notify={setToast} />
          <ThemeControl theme={state.settings.theme} notify={setToast} />
          <a
            className={styles.github}
            href={repositoryUrl()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('footerGitHub')}
            title={t('footerGitHub')}
          >
            <GitHubIcon />
          </a>
        </div>
      </header>
      <div className={`sm-tape ${styles.sheet}`}>
        <Sidebar
          groups={state.siteGroups}
          selectedId={group?.id}
          onAdded={openNewGroup}
          notify={setToast}
        />
        <main ref={pane.mainRef} className={styles.main}>
          {isUnreadable && <UnreadableBanner notify={setToast} />}
          <RevokeContext value={offerRevoke}>
            <Pane
              route={route}
              state={state}
              group={group}
              notify={setToast}
              onAdded={openNewGroup}
            />
          </RevokeContext>
        </main>
      </div>
      <footer>
        <SiteLinks />
      </footer>
      <Toast
        toast={toast}
        onDismiss={() => {
          toast?.onExpire?.();
          setToast(undefined);
        }}
        dismissLabel={t('optionsDismiss')}
        onFocusLost={pane.focusPane}
        {...(toast?.durationMs && { durationMs: toast.durationMs })}
      />
    </div>
  );
}
