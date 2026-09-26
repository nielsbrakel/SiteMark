import { notImplemented } from '../../core/not-implemented';
import type { TabStatus } from '../../core/render/status';
import type { Result } from '../../core/result';
import type { TabMessageError, Tabs } from '../ports';

/** `invalidResponse`: the content script answered something that isn't a TabStatus. */
export type TabStatusError = TabMessageError | 'invalidResponse';

/** Asks the marker in `tabId` for its status and validates the answer (REQ-SEC-003). */
export function requestTabStatus(
  _tabs: Tabs,
  _tabId: number,
): Promise<Result<TabStatus, TabStatusError>> {
  return notImplemented();
}
