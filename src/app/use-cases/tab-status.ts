import { parseTabStatus, type TabStatus } from '../../core/render/status';
import { err, ok, type Result } from '../../core/result';
import type { TabMessageError, Tabs } from '../ports';
import { tabMessage } from '../protocol';

/** `invalidResponse`: the content script answered something that isn't a TabStatus. */
export type TabStatusError = TabMessageError | 'invalidResponse';

/** Asks the marker in `tabId` for its status and validates the answer (REQ-SEC-003). */
export async function requestTabStatus(
  tabs: Tabs,
  tabId: number,
): Promise<Result<TabStatus, TabStatusError>> {
  const answer = await tabs.sendMessage(tabId, tabMessage('getStatus', undefined));
  if (!answer.ok) return answer;
  const status = parseTabStatus(answer.value);
  return status.ok ? ok(status.value) : err('invalidResponse');
}
