import type { InjectionError } from '@/app/ports';
import type { MessagingError } from '@/app/protocol';
import type { MarkId } from '@/core/ids';
import type { Result } from '@/core/result';
import { sendToBackground } from '@/platform/send-message';

/** Why the picker didn't start: the page refused the script, or the background didn't answer. */
export type PickerFailure = InjectionError | MessagingError;

/**
 * Starts the picker in the tab (REQ-PICK-001), for a re-pick when `repickMarkId` is given
 * (REQ-PICK-007), and closes the popup so the page gets the pointer. `injectionFailed` is the
 * ground truth that SiteMark can't run on the page (REQ-POP-005).
 */
export async function startPicker(
  tabId: number,
  repickMarkId?: MarkId,
): Promise<Result<void, PickerFailure>> {
  const request = repickMarkId === undefined ? { tabId } : { tabId, repickMarkId };
  const reply = await sendToBackground('startPicker', request);
  const result = reply.ok ? reply.value : reply;
  if (result.ok) window.close();
  return result;
}
