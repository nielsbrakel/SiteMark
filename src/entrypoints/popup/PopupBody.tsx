import type { ReactNode } from 'react';
import type { SiteMarkState } from '@/core/model/schema';
import { isKnownRestrictedUrl } from '@/core/restricted';
import { t } from '@/lib/i18n/browser-source';
import type { SiteMarkStateView } from '@/ui/hooks/state-view';
import type { CurrentTab } from '@/ui/hooks/use-current-tab';
import { CantRun } from './CantRun';
import { DataNotice } from './DataNotice';
import { SiteStatus } from './SiteStatus';

export type PopupBodyProps = {
  readonly tab: CurrentTab;
  readonly view: SiteMarkStateView;
  /** The stored data can't be read and the background works with the defaults (D-264). */
  readonly isUnreadable: boolean;
};

type TabBodyProps = { readonly tab: CurrentTab; readonly state: SiteMarkState | undefined };

/** The tab's part: can't run, or its site status once the state is known. */
function TabBody({ tab, state }: TabBodyProps): ReactNode {
  if (tab.status !== 'ready') return null;
  // The browser withholds the URL of pages activeTab doesn't cover: SiteMark can't run there.
  if (tab.url === undefined || isKnownRestrictedUrl(tab.url)) return <CantRun tabId={tab.tabId} />;
  return state && <SiteStatus tab={{ id: tab.tabId, url: tab.url }} state={state} />;
}

/** What the popup shows below its header: data problems first, then the tab. */
export function PopupBody({ tab, view, isUnreadable }: PopupBodyProps): ReactNode {
  // Read-only data (REQ-DATA-007): nothing can be shown or changed, so only the notice.
  if (view.status === 'readOnly') return <DataNotice problem="readOnly" />;
  const error = view.status === 'error' ? view.error : undefined;
  return (
    <>
      {(isUnreadable || error === 'stateUnreadable') && <DataNotice problem="unreadable" />}
      {error && error !== 'stateUnreadable' && <p role="alert">{t('popupNotResponding')}</p>}
      <TabBody tab={tab} state={view.status === 'ready' ? view.state : undefined} />
    </>
  );
}
