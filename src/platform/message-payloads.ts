import type { BackgroundMessageType, BackgroundProtocol, DataOf } from '../app/protocol';
import type { SchemaResult } from '../core/model/schema';
import { notImplemented } from '../core/not-implemented';

/** Every message the background answers. */
export function backgroundMessageTypes(): readonly BackgroundMessageType[] {
  return notImplemented();
}

/** Validates the payload of a `type` message; never throws (D-225). */
export function parsePayload<K extends BackgroundMessageType>(
  _type: K,
  _data: unknown,
): SchemaResult<DataOf<BackgroundProtocol, K>> {
  return notImplemented();
}
