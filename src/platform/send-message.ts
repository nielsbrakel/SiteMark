import type {
  BackgroundMessageType,
  BackgroundProtocol,
  DataOf,
  MessagingError,
  ResponseOf,
} from '../app/protocol';
import { notImplemented } from '../core/not-implemented';
import type { Result } from '../core/result';

type DataArgs<K extends BackgroundMessageType> =
  DataOf<BackgroundProtocol, K> extends undefined ? [] : [data: DataOf<BackgroundProtocol, K>];

/** Sends a message to the background (from an extension page or a content script). */
export function sendToBackground<K extends BackgroundMessageType>(
  _type: K,
  ..._data: DataArgs<K>
): Promise<Result<ResponseOf<BackgroundProtocol, K>, MessagingError>> {
  return notImplemented();
}
