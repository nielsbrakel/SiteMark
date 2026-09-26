import { notImplemented } from '../../core/not-implemented';
import type { Tabs } from '../ports';

/** "Hide on this tab" (REQ-RND-008, REQ-CMD-002): flips the marker's hidden state in the tab. */
export async function toggleHidden(_tabs: Tabs, _tabId: number): Promise<void> {
  return notImplemented();
}
