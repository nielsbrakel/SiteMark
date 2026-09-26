import type { ReactNode } from 'react';
import type { SiteMarkState } from '@/core/model/schema';
import { matchingGroups } from '@/core/url/group-match';
import { NoMatch } from './NoMatch';
import styles from './SiteStatus.module.css';
import { StatusList } from './StatusList';

export type SiteStatusProps = {
  readonly url: string;
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
export function SiteStatus({ url, state }: SiteStatusProps): ReactNode {
  const groups = matchingGroups(state, url);
  return (
    <>
      <p className={styles.host}>{hostOf(url)}</p>
      {groups.length > 0 ? <StatusList groups={groups} /> : <NoMatch />}
    </>
  );
}
