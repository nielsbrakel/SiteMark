import type { ReactNode } from 'react';
import { t } from '@/lib/i18n/browser-source';
import { optionsPageUrl } from '@/platform/deep-links';
import { Wordmark } from '@/ui/components/Wordmark';
import { HelpLink } from '@/ui/HelpLink';
import { useCurrentTab } from '@/ui/hooks/use-current-tab';
import { useSiteMarkState } from '@/ui/hooks/use-site-mark-state';
import { useTheme } from '@/ui/hooks/use-theme';
import { SiteLinks } from '@/ui/SiteLinks';
import styles from './App.module.css';
import { PopupBody } from './PopupBody';
import { useStoredUnreadable } from './use-stored-unreadable';

export type PopupAppProps = {
  /** `location.search`: `?tabId=` picks the tab in e2e builds (src/ui/hooks/use-current-tab.ts). */
  readonly search?: string;
};

/** The toolbar popup (REQ-POP-001…007, design.md §5.1): the site groups on the current tab. */
export function PopupApp({ search }: PopupAppProps): ReactNode {
  const tab = useCurrentTab(search);
  const view = useSiteMarkState();
  const isUnreadable = useStoredUnreadable();
  useTheme(view.status === 'ready' ? view.state.settings.theme : undefined);
  return (
    <main className={styles.popup}>
      <header className={styles.header}>
        <Wordmark />
        <h1 className="sm-visually-hidden">{t('popupTitle')}</h1>
        <div className={styles.nav}>
          <HelpLink />
          <a
            className="sm-nav-link"
            href={optionsPageUrl({ page: 'settings' })}
            target="_blank"
            rel="noreferrer"
          >
            {t('popupSettings')}
          </a>
        </div>
      </header>
      <div className={`sm-tape ${styles.sheet}`}>
        <PopupBody tab={tab} view={view} isUnreadable={isUnreadable} />
      </div>
      <footer className={styles.footer}>
        <SiteLinks />
      </footer>
    </main>
  );
}
