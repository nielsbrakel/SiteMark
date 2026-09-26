import type { ReactNode } from 'react';
import logo from '@/assets/logo.svg';
import { t } from '@/lib/i18n/browser-source';
import type { SiteMarkStateView } from '@/ui/hooks/state-view';
import { type CurrentTab, useCurrentTab } from '@/ui/hooks/use-current-tab';
import { useSiteMarkState } from '@/ui/hooks/use-site-mark-state';
import { useTheme } from '@/ui/hooks/use-theme';
import styles from './App.module.css';
import { SiteStatus } from './SiteStatus';

export type PopupAppProps = {
  /** `location.search`: `?tabId=` picks the tab in e2e builds (src/ui/hooks/use-current-tab.ts). */
  readonly search?: string;
};

type BodyProps = { readonly tab: CurrentTab; readonly view: SiteMarkStateView };

/** What the popup shows below its header, once the tab and the state are known. */
function Body({ tab, view }: BodyProps): ReactNode {
  if (tab.status !== 'ready' || tab.url === undefined || view.status !== 'ready') return null;
  return <SiteStatus url={tab.url} state={view.state} />;
}

/** The toolbar popup (REQ-POP-001…007, design.md §5.1): the site groups on the current tab. */
export function PopupApp({ search }: PopupAppProps): ReactNode {
  const tab = useCurrentTab(search);
  const view = useSiteMarkState();
  useTheme(view.status === 'ready' ? view.state.settings.theme : undefined);
  return (
    <main className={styles.popup}>
      <header className={styles.header}>
        <img src={logo} alt="" width={32} height={32} />
        <h1>{t('popupTitle')}</h1>
      </header>
      <Body tab={tab} view={view} />
    </main>
  );
}
