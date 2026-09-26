import { browser } from 'wxt/browser';
import type {
  BackgroundMessageType,
  BackgroundProtocol,
  DataOf,
  MessagingError,
  Reply,
  ResponseOf,
} from '../app/protocol';
import { err, type Result } from '../core/result';

// Extension pages and content scripts → background (plan §4). Content-safe: no schemas here; the
// background validates everything it receives (REQ-SEC-003) and its replies are trusted.

type DataArgs<K extends BackgroundMessageType> =
  DataOf<BackgroundProtocol, K> extends undefined ? [] : [data: DataOf<BackgroundProtocol, K>];

function isReply(value: unknown): value is Reply<unknown> {
  return (
    typeof value === 'object' && value !== null && 'ok' in value && typeof value.ok === 'boolean'
  );
}

/**
 * Sends a message to the background (from an extension page or a content script) and returns its
 * reply. `noReceiver` when nothing answered, e.g. while the extension updates.
 */
export async function sendToBackground<K extends BackgroundMessageType>(
  type: K,
  ...[data]: DataArgs<K>
): Promise<Result<ResponseOf<BackgroundProtocol, K>, MessagingError>> {
  try {
    const answer: unknown = await browser.runtime.sendMessage(
      data === undefined ? { type } : { type, data },
    );
    // The background answers every message with the Reply of its type.
    return isReply(answer)
      ? (answer as Reply<ResponseOf<BackgroundProtocol, K>>)
      : err('noReceiver');
  } catch {
    return err('noReceiver');
  }
}
