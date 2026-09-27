import type { Permissions, Tabs } from '../ports';
import type { ContentSender } from '../protocol';
import { requestTabStatus } from './tab-status';

// After a pick is saved (REQ-PICK-006): the picker was injected through activeTab, which also
// lets the background inject the marker into that tab, granted or not. On a site that isn't
// granted the mark then shows on this tab only, until a reload; the panel says so.

/** Whether SiteMark may run on the sender's host on every visit (REQ-PICK-006). */
export async function isSenderGranted(
  permissions: Pick<Permissions, 'contains'>,
  sender: ContentSender,
): Promise<boolean> {
  // Origin patterns carry no port (D-260): the grant covers the host.
  return permissions.contains([`*://${new URL(sender.origin).hostname}/*`]);
}

export type ShowOnTabDeps = {
  readonly tabs: Pick<Tabs, 'sendMessage' | 'inject'>;
  readonly markerFiles: readonly string[];
};

/** Makes a saved pick visible on the picker's tab right away (REQ-PICK-006: through activeTab). */
export async function showOnTab(deps: ShowOnTabDeps, tabId: number): Promise<void> {
  // A running marker already got the new plan with the commit (pushPlans).
  const running = await requestTabStatus(deps.tabs, tabId);
  if (!running.ok) await deps.tabs.inject(tabId, deps.markerFiles);
}
