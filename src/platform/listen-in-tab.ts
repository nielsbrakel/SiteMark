import { browser } from 'wxt/browser';
import type { Unsubscribe } from '../app/ports';
import type { DataOf, PickerProtocol, TabHandlers, TabMessageType } from '../app/protocol';
import { isExtensionPage, type MessageSender } from './message-senders';

// The content script's side of `tabs.sendMessage` (plan §4). Content scripts have to listen to
// runtime.onMessage to receive their render plan, but they take messages only from SiteMark
// itself: its background or an extension page, never a tab (REQ-SEC-002, REQ-SEC-003). The
// background is the authority, so its payloads are not re-validated here (no zod in the marker).
// The marker and the picker each listen for their own message types only.

const TAB_TYPES: Readonly<Record<TabMessageType, true>> = {
  applyPlan: true,
  setHidden: true,
  getStatus: true,
};

/** The picker's handlers for the background's messages (PickerProtocol). */
export type PickerHandlers = {
  readonly repick: (data: DataOf<PickerProtocol, 'repick'>) => void;
};

const PICKER_TYPES: Readonly<Record<keyof PickerHandlers, true>> = { repick: true };

type Handle = (type: string, data: unknown, sendResponse: (response: unknown) => void) => void;

function messageType(message: unknown, types: Readonly<Record<string, true>>): string | undefined {
  if (typeof message !== 'object' || message === null || !('type' in message)) return undefined;
  const { type } = message;
  return typeof type === 'string' && Object.hasOwn(types, type) ? type : undefined;
}

/** One runtime.onMessage listener for `types`, from SiteMark's background or pages only. */
function listen(types: Readonly<Record<string, true>>, handle: Handle): Unsubscribe {
  const listener = (
    message: unknown,
    sender: MessageSender,
    sendResponse: (response: unknown) => void,
  ): void => {
    const type = messageType(message, types);
    if (type === undefined || sender.tab !== undefined || !isExtensionPage(sender)) return;
    handle(type, (message as { data?: unknown }).data, sendResponse);
  };
  browser.runtime.onMessage.addListener(listener);
  return () => browser.runtime.onMessage.removeListener(listener);
}

/**
 * Registers the content script's listener for applyPlan, setHidden and getStatus. The handlers run
 * synchronously and the answer (getStatus only) goes back at once, so the background never waits.
 */
export function listenForBackground(handlers: TabHandlers): Unsubscribe {
  return listen(TAB_TYPES, (type, data, sendResponse) => {
    // The type is one of ours and the background built the payload for it (tabMessage()).
    const answer = (handlers[type as TabMessageType] as (data: unknown) => unknown)(data);
    if (type === 'getStatus') sendResponse(answer);
  });
}

/**
 * Registers the picker's listener for `repick` (REQ-PICK-007), with the same sender rule as the
 * marker's: SiteMark's background or an extension page, never a tab.
 */
export function listenForPicker(handlers: PickerHandlers): Unsubscribe {
  return listen(PICKER_TYPES, (_type, data) => {
    // The background built the payload (pickerMessage()).
    handlers.repick(data as DataOf<PickerProtocol, 'repick'>);
  });
}
