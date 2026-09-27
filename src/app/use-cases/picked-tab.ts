import { notImplemented } from '../../core/not-implemented';
import type { Permissions, Tabs } from '../ports';
import type { ContentSender } from '../protocol';

/** Whether SiteMark may run on the sender's host on every visit (REQ-PICK-006). */
export async function isSenderGranted(
  _permissions: Pick<Permissions, 'contains'>,
  _sender: ContentSender,
): Promise<boolean> {
  return notImplemented();
}

export type ShowOnTabDeps = {
  readonly tabs: Pick<Tabs, 'sendMessage' | 'inject'>;
  readonly markerFiles: readonly string[];
};

/** Makes a saved pick visible on the picker's tab right away (REQ-PICK-006: through activeTab). */
export async function showOnTab(_deps: ShowOnTabDeps, _tabId: number): Promise<void> {
  return notImplemented();
}
