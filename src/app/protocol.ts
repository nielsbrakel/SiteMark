import type { Command } from '../core/commands/command';
import type { ImportError } from '../core/data/import';
import type { ImportedRegex } from '../core/data/merge-import';
import type { ErrorCode } from '../core/errors';
import type { MarkId, SiteGroupId } from '../core/ids';
import type { SiteOrigin } from '../core/model/defaults';
import type { ElementEffects, Hex, SiteMarkState } from '../core/model/schema';
import { notImplemented } from '../core/not-implemented';
import type { RenderPlan } from '../core/render/render-plan';
import type { TabStatus } from '../core/render/status';
import type { Result } from '../core/result';
import type { OriginPattern } from '../core/url/origin';
import type { Committed } from './command-queue';
import type { InjectionError } from './ports';

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
  /**
   * Re-pick (REQ-PICK-007): the element mark whose selector the pick replaces. The background hands
   * it to the picker when it starts it (`PickerProtocol.repick`); `siteGroupId`, `effects` and
   * `color` are then ignored.
   */
  readonly repickMarkId?: MarkId;
};

/**
 * "Mark this site" from the popup (REQ-POP-006): the tab it was opened on and that tab's origin.
 * The background adds the group and shows it on the tab through activeTab, granted or not.
 */
export type MarkThisSiteRequest = { readonly tabId: number; readonly origin: SiteOrigin };

/** Import (REQ-DATA-004): Merge updates or adds groups by ID; Replace swaps everything. */
export type ImportMode = 'merge' | 'replace';

/** An import file's text, read by the options page (≤ 1 MB, checked by the background). */
export type ImportFile = { readonly text: string };

/** The import preview: "N updated, M new, K new origins", with the regex patterns highlighted. */
export type ImportSummary = {
  readonly updated: number;
  readonly added: number;
  /** The new origins that are not granted yet: requested in ONE prompt on Apply (REQ-DATA-005). */
  readonly originsToRequest: readonly OriginPattern[];
  readonly regexPatterns: readonly ImportedRegex[];
};

/** Why an import was not applied: the file's problem, or the queue's (e.g. `stateReadOnly`). */
export type ImportFailure = ImportError | { readonly code: ErrorCode };

/** Extension pages (popup, options, grant) → background. */
export type PageProtocol = {
  command: Message<Command, Result<Committed, ErrorCode>>;
  /** A read-only view for the popup and options page. */
  getState: Message<undefined, SiteMarkState>;
  /** `injectionFailed`: the picker can't run on this page (REQ-POP-005, REQ-CMD-001). */
  startPicker: Message<
    { readonly tabId: number; readonly repickMarkId?: MarkId },
    Result<void, InjectionError>
  >;
  toggleHidden: Message<{ readonly tabId: number }, void>;
  getTabStatus: Message<{ readonly tabId: number }, TabStatusAnswer>;
  markThisSite: Message<MarkThisSiteRequest, Result<Committed, ErrorCode>>;
  /** Parses and previews an import file; changes nothing. */
  importPreview: Message<ImportFile, Result<ImportSummary, ImportFailure>>;
  /** Parses the file again and applies it through the queue (the preview is not kept). */
  importApply: Message<
    ImportFile & { readonly mode: ImportMode },
    Result<Committed, ImportFailure>
  >;
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

/**
 * Background → the picker of one tab (`tabs.sendMessage`), right after injecting it. The picker
 * (T-111) listens for it; the marker ignores it.
 */
export type PickerProtocol = {
  /** This pick replaces the selector of `markId` (REQ-PICK-007). */
  repick: Message<{ readonly markId: MarkId }, void>;
};

export type BackgroundProtocol = PageProtocol & ContentProtocol;
export type PageMessageType = keyof PageProtocol;
export type ContentMessageType = keyof ContentProtocol;
export type BackgroundMessageType = keyof BackgroundProtocol;
export type TabMessageType = keyof TabProtocol;
export type PickerMessageType = keyof PickerProtocol;

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
  type: K,
  data: DataOf<TabProtocol, K>,
): Envelope<TabProtocol, K> {
  // TypeScript can't narrow the conditional Envelope type through the check on `data`.
  return (data === undefined ? { type } : { type, data }) as Envelope<TabProtocol, K>;
}

/** A message for a tab's picker, e.g. `pickerMessage('repick', { markId })`. */
export function pickerMessage<K extends PickerMessageType>(
  _type: K,
  _data: DataOf<PickerProtocol, K>,
): Envelope<PickerProtocol, K> {
  return notImplemented();
}
