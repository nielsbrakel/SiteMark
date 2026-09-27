import { browser } from 'wxt/browser';
import type { Unsubscribe } from '../app/ports';
import type { DataOf, PickerProtocol, TabHandlers, TabMessageType } from '../app/protocol';
import { notImplemented } from '../core/not-implemented';
import { isExtensionPage, type MessageSender } from './message-senders';

// The content script's side of `tabs.sendMessage` (plan §4). Content scripts have to listen to
// runtime.onMessage to receive their render plan, but they take messages only from SiteMark
// itself: its background or an extension page, never a tab (REQ-SEC-002, REQ-SEC-003). The
// background is the authority, so its payloads are not re-validated here (no zod in the marker).

const TYPES: Readonly<Record<TabMessageType, true>> = {
  applyPlan: true,
  setHidden: true,
  getStatus: true,
};

function tabMessageType(message: unknown): TabMessageType | undefined {
  if (typeof message !== 'object' || message === null || !('type' in message)) return undefined;
  const { type } = message;
  return typeof type === 'string' && Object.hasOwn(TYPES, type)
    ? (type as TabMessageType)
    : undefined;
}

/**
 * Registers the content script's listener for applyPlan, setHidden and getStatus. The handlers run
 * synchronously and the answer (getStatus only) goes back at once, so the background never waits.
 */
export function listenForBackground(handlers: TabHandlers): Unsubscribe {
  const listener = (
    message: unknown,
    sender: MessageSender,
    sendResponse: (response: unknown) => void,
  ): void => {
    const type = tabMessageType(message);
    if (type === undefined || sender.tab !== undefined || !isExtensionPage(sender)) return;
    const { data } = message as { data?: unknown };
    // The type is one of ours and the background built the payload for it (tabMessage()).
    const answer = (handlers[type] as (data: unknown) => unknown)(data);
    if (type === 'getStatus') sendResponse(answer);
  };
  browser.runtime.onMessage.addListener(listener);
  return () => browser.runtime.onMessage.removeListener(listener);
}

/** The picker's handlers for the background's messages (PickerProtocol). */
export type PickerHandlers = {
  readonly repick: (data: DataOf<PickerProtocol, 'repick'>) => void;
};

/**
 * Registers the picker's listener for `repick` (REQ-PICK-007), with the same sender rule as the
 * marker's: SiteMark's background or an extension page, never a tab.
 */
export function listenForPicker(_handlers: PickerHandlers): Unsubscribe {
  return notImplemented();
}
