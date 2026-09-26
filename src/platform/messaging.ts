import { browser } from 'wxt/browser';
import type { Logger, Unsubscribe } from '../app/ports';
import type {
  BackgroundHandlers,
  BackgroundMessageType,
  ContentSender,
  Reply,
} from '../app/protocol';
import { err, ok } from '../core/result';
import { parsePayload, senderKind } from './message-payloads';
import { contentSenderOf, isExtensionPage, type MessageSender } from './message-senders';

// The background's message router (plan §4, REQ-SEC-003). A message is handled only when its type
// is known, its sender is the right kind (an extension page, or a SiteMark content script in a top
// frame) and its payload passes the schema. Everything else is refused without calling a handler.
// Content handlers get the sender's tab, URL and origin, read from `sender` only (REQ-SEC-001).

type Request = {
  readonly type: BackgroundMessageType;
  /** `[data]` for page messages, `[data, sender]` for content messages. */
  readonly args: readonly [unknown] | readonly [unknown, ContentSender];
};

/** The handler for `type`, with its payload already checked by that type's schema. */
type ErasedHandler = (...args: Request['args']) => unknown;

function readRequest(message: unknown, sender: MessageSender): Request | undefined {
  if (typeof message !== 'object' || message === null) return undefined;
  const { type, data } = message as { type?: unknown; data?: unknown };
  const kind = senderKind(type);
  if (kind === undefined) return undefined;
  const from = kind === 'content' ? contentSenderOf(sender) : undefined;
  if (kind === 'page' ? !isExtensionPage(sender) : from === undefined) return undefined;
  // senderKind() only knows the protocol's message types.
  const known = type as BackgroundMessageType;
  const payload = parsePayload(known, data);
  if (!payload.ok) return undefined;
  return { type: known, args: from ? [payload.value, from] : [payload.value] };
}

async function reply(
  handlers: BackgroundHandlers,
  logger: Logger,
  message: unknown,
  sender: MessageSender,
): Promise<Reply<unknown>> {
  const request = readRequest(message, sender);
  if (!request) {
    logger.warn('Refused a message');
    return err('messageRefused');
  }
  // The payload passed the schema of `request.type`, so it fits that handler.
  const handle = handlers[request.type] as ErasedHandler;
  try {
    return ok(await handle(...request.args));
  } catch (error) {
    logger.error(`The ${request.type} handler failed`, error);
    return err('handlerFailed');
  }
}

/**
 * Registers the background's one `runtime.onMessage` listener (REQ-SEC-003). Call it synchronously
 * at the top level of the background. Every message gets a `Reply`; the listener returns `true`
 * and answers through `sendResponse`, which works in Chrome, Firefox and Safari alike.
 */
export function listenForMessages(handlers: BackgroundHandlers, logger: Logger): Unsubscribe {
  const listener = (
    message: unknown,
    sender: MessageSender,
    sendResponse: (response: unknown) => void,
  ): true => {
    void reply(handlers, logger, message, sender).then(sendResponse);
    return true;
  };
  browser.runtime.onMessage.addListener(listener);
  return () => browser.runtime.onMessage.removeListener(listener);
}
