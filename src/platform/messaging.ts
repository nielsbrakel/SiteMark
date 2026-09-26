import type { Logger, Unsubscribe } from '../app/ports';
import type { BackgroundHandlers } from '../app/protocol';
import { notImplemented } from '../core/not-implemented';

/**
 * Registers the background's one `runtime.onMessage` listener (REQ-SEC-003). Call it synchronously
 * at the top level of the background.
 */
export function listenForMessages(_handlers: BackgroundHandlers, _logger: Logger): Unsubscribe {
  return notImplemented();
}
