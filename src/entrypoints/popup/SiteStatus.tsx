import type { ReactNode } from 'react';
import type { SiteMarkState } from '@/core/model/schema';
import { matchingGroups } from '@/core/url/group-match';
import type { PopupTab } from '@/platform/mark-this-site-click';
import { AccessNotice } from './AccessNotice';
import { NoMatch } from './NoMatch';
import { neededOrigins } from './needed-origins';
import styles from './SiteStatus.module.css';
import { StatusList } from './StatusList';
import { useGranted } from './use-granted';

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

/** The tab's host and the site groups that match it, or Mark this site (REQ-POP-001). */
export function SiteStatus({ tab, state }: SiteStatusProps): ReactNode {
  const groups = matchingGroups(state, tab.url);
  const origins = neededOrigins(state, tab.url);
  const granted = useGranted(origins);
  const { host, hostname } = siteOf(tab.url);
  return (
    <>
      <p className={styles.host}>{host}</p>
      {origins.length > 0 && granted === false && (
        <AccessNotice host={hostname} origins={origins} />
      )}
      {groups.length > 0 ? <StatusList groups={groups} /> : <NoMatch tab={tab} />}
    </>
  );
}
