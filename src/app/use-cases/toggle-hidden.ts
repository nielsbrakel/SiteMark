import type { Tabs } from '../ports';
import { tabMessage } from '../protocol';
import { requestTabStatus } from './tab-status';

// "Hide on this tab" lives in the marker's memory (D-207): the background asks the marker whether
// it is hidden and tells it the opposite. A tab without a marker has nothing to hide.

/** "Hide on this tab" (REQ-RND-008, REQ-CMD-002): flips the marker's hidden state in the tab. */
export async function toggleHidden(tabs: Tabs, tabId: number): Promise<void> {
  const status = await requestTabStatus(tabs, tabId);
  if (!status.ok) return;
  await tabs.sendMessage(tabId, tabMessage('setHidden', { hidden: !status.value.hidden }));
}
