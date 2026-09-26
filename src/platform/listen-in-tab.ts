import type { Unsubscribe } from '../app/ports';
import type { TabHandlers } from '../app/protocol';
import { notImplemented } from '../core/not-implemented';

/** The content script's listener for messages from the background (applyPlan, setHidden, getStatus). */
export function listenForBackground(_handlers: TabHandlers): Unsubscribe {
  return notImplemented();
}
