import type { ReactNode } from 'react';
import type { SiteMarkState } from '@/core/model/schema';
import { matchingGroups } from '@/core/url/group-match';
import type { PopupTab } from '@/platform/mark-this-site-click';
import { NoMatch } from './NoMatch';
import styles from './SiteStatus.module.css';
import { StatusList } from './StatusList';

export type SiteStatusProps = {
  /** The tab the popup was opened on, with its URL (known through activeTab). */
  readonly tab: PopupTab;
  readonly state: SiteMarkState;
};

/** `app.example.com:8443` for a page URL; `undefined` for anything `URL` can't parse. */
function hostOf(url: string): string | undefined {
  try {
    return new URL(url).host || undefined;
  } catch {
    return undefined;
  }
}

/** The tab's host and the site groups that match it, or Mark this site (REQ-POP-001). */
export function SiteStatus({ tab, state }: SiteStatusProps): ReactNode {
  const groups = matchingGroups(state, tab.url);
  return (
    <>
      <p className={styles.host}>{hostOf(tab.url)}</p>
      {groups.length > 0 ? <StatusList groups={groups} /> : <NoMatch tab={tab} />}
    </>
  );
}
