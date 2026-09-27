import type { ReactNode } from 'react';
import type { TabStatusAnswer } from '@/app/protocol';
import type { SiteMarkState } from '@/core/model/schema';
import type { TabStatus } from '@/core/render/status';
import { activeGroups, matchingGroups } from '@/core/url/group-match';
import { t } from '@/lib/i18n/browser-source';
import type { PopupTab } from '@/platform/mark-this-site-click';
import { WarningIcon } from '@/ui/components/icons';
import { AccessNotice } from './AccessNotice';
import { Actions } from './Actions';
import { NoMatch } from './NoMatch';
import { neededOrigins } from './needed-origins';
import styles from './SiteStatus.module.css';
import { StatusList } from './StatusList';
import { startPicker } from './start-picker';
import { useGranted } from './use-granted';
import { useShortcuts } from './use-shortcuts';
import { useTabStatus } from './use-tab-status';

export type SiteStatusProps = {
  /** The tab the popup was opened on, with its URL (known through activeTab). */
  readonly tab: PopupTab;
  readonly state: SiteMarkState;
};

/** The parts of a page URL the popup shows; empty for anything `URL` can't parse. */
function siteOf(url: string): { readonly host: string; readonly hostname: string } {
  try {
    const { host, hostname } = new URL(url);
    return { host, hostname };
  } catch {
    return { host: '', hostname: '' };
  }
}

/** The marker's report, or `undefined` when no marker runs (or the page is restricted). */
function reportOf(answer: TabStatusAnswer | undefined): TabStatus | undefined {
  return typeof answer === 'object' ? answer : undefined;
}

/** The tab's host and the site groups that match it, or Mark this site (REQ-POP-001). */
export function SiteStatus({ tab, state }: SiteStatusProps): ReactNode {
  const groups = matchingGroups(state, tab.url);
  const activeIds = new Set(activeGroups(state, tab.url).map((group) => group.id));
  const origins = neededOrigins(state, tab.url);
  const granted = useGranted(origins);
  const tabStatus = useTabStatus(tab.id, state.revision);
  const status = reportOf(tabStatus.status);
  const shortcuts = useShortcuts();
  const { host, hostname } = siteOf(tab.url);
  return (
    <>
      <p className={styles.host}>{host}</p>
      {origins.length > 0 && granted === false && (
        <AccessNotice host={hostname} origins={origins} />
      )}
      {groups.length > 0 ? (
        <StatusList
          groups={groups}
          activeIds={activeIds}
          status={status}
          onRepick={(markId) => void startPicker(tab.id, markId)}
        />
      ) : (
        <NoMatch tab={tab} />
      )}
      {status?.favicon === 'unavailable' && (
        <p className={styles.notice}>
          <WarningIcon />
          {t('popupFaviconUnavailable')}
        </p>
      )}
      <Actions tabId={tab.id} status={status} shortcuts={shortcuts} onToggled={tabStatus.refresh} />
    </>
  );
}
