import type { Command } from '../core/commands/command';
import type { ErrorCode } from '../core/errors';
import type { MarkId, SiteGroupId } from '../core/ids';
import type { ElementEffects, Hex, SiteMarkState } from '../core/model/schema';
import { notImplemented } from '../core/not-implemented';
import type { RenderPlan } from '../core/render/render-plan';
import type { TabStatus } from '../core/render/status';
import type { Result } from '../core/result';
import type { Committed } from './command-queue';

// The message protocol between SiteMark's contexts (plan §4, REQ-SEC-001, REQ-SEC-003). Types and one
// tiny builder, so content scripts can import it without pulling in anything: the background's
// validation lives in src/platform/messaging.ts. Every message travels as `{ type, data }`.

/** One message: what the sender passes and what it gets back. */
type Message<Data, Response> = { readonly data: Data; readonly response: Response };

/** getTabStatus: `not-injected` when no marker runs in the tab, `restricted` on pages SiteMark can't run on. */
export type TabStatusAnswer = TabStatus | 'not-injected' | 'restricted';

export type ElementEffectKind = keyof ElementEffects;

/** The picker's save intent (REQ-PICK-005). The origin and URL come from the sender, never from here. */
export type SavePick = {
  readonly selector: string;
  /** An active group for the sender's URL; left out for "New site group for <origin>". */
  readonly siteGroupId?: SiteGroupId;
  readonly effects: readonly ElementEffectKind[];
  readonly color: Hex;
};

/** Extension pages (popup, options, grant) → background. */
export type PageProtocol = {
  command: Message<Command, Result<Committed, ErrorCode>>;
  /** A read-only view for the popup and options page. */
  getState: Message<undefined, SiteMarkState>;
  startPicker: Message<{ readonly tabId: number; readonly repickMarkId?: MarkId }, void>;
  toggleHidden: Message<{ readonly tabId: number }, void>;
  getTabStatus: Message<{ readonly tabId: number }, TabStatusAnswer>;
};

/** Top-frame content scripts (marker, picker) → background: narrow intents only (REQ-SEC-001). */
export type ContentProtocol = {
  /** The plan for the sender's own URL, and nothing else (REQ-SEC-002). */
  renderPlanFor: Message<undefined, RenderPlan>;
  reportStatus: Message<TabStatus, void>;
  savePick: Message<SavePick, Result<MarkId, ErrorCode>>;
  /** Opens grant.html for the sender's origin (D-229). */
  requestGrant: Message<undefined, void>;
  openOptions: Message<{ readonly route: string }, void>;
};

/** Background → the content script of one tab (`tabs.sendMessage`). */
export type TabProtocol = {
  applyPlan: Message<RenderPlan, void>;
  setHidden: Message<{ readonly hidden: boolean }, void>;
  getStatus: Message<undefined, TabStatus>;
};

export type BackgroundProtocol = PageProtocol & ContentProtocol;
export type PageMessageType = keyof PageProtocol;
export type ContentMessageType = keyof ContentProtocol;
export type BackgroundMessageType = keyof BackgroundProtocol;
export type TabMessageType = keyof TabProtocol;

export type DataOf<P, K extends keyof P> = P[K] extends Message<infer D, unknown> ? D : never;
export type ResponseOf<P, K extends keyof P> = P[K] extends Message<unknown, infer R> ? R : never;

/** A message on the wire; `data` is left out when the message has none. */
export type Envelope<P, K extends keyof P> =
  DataOf<P, K> extends undefined
    ? { readonly type: K; readonly data?: undefined }
    : { readonly type: K; readonly data: DataOf<P, K> };

/**
 * Why the background did not answer a message: `messageRefused` (unknown type, wrong sender or
 * invalid payload) or `handlerFailed` (the handler threw; details stay in the background's log).
 */
export type Refusal = 'messageRefused' | 'handlerFailed';

/** What the background sends back for every message. */
export type Reply<R> = Result<R, Refusal>;

/** `noReceiver`: nothing answered (the background is starting or updating). */
export type MessagingError = Refusal | 'noReceiver';

/** A content-script sender, read from `sender` only, never from the payload (REQ-SEC-001). */
export type ContentSender = {
  readonly tabId: number;
  readonly url: string;
  /** `https://example.com` (scheme, host and port). */
  readonly origin: string;
};

type MaybePromise<T> = T | Promise<T>;

export type PageHandlers = {
  readonly [K in PageMessageType]: (
    data: DataOf<PageProtocol, K>,
  ) => MaybePromise<ResponseOf<PageProtocol, K>>;
};

export type ContentHandlers = {
  readonly [K in ContentMessageType]: (
    data: DataOf<ContentProtocol, K>,
    sender: ContentSender,
  ) => MaybePromise<ResponseOf<ContentProtocol, K>>;
};

/** One handler per background message; a missing one is a type error. */
export type BackgroundHandlers = PageHandlers & ContentHandlers;

/** The content script's handlers answer right away, so the background never waits on a page. */
export type TabHandlers = {
  readonly [K in TabMessageType]: (data: DataOf<TabProtocol, K>) => ResponseOf<TabProtocol, K>;
};

/** A message for a tab's content script, e.g. `tabMessage('applyPlan', plan)`. */
export function tabMessage<K extends TabMessageType>(
  _type: K,
  _data: DataOf<TabProtocol, K>,
): Envelope<TabProtocol, K> {
  return notImplemented();
}
