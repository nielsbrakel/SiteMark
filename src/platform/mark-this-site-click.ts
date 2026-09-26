import type { Committed } from '../app/command-queue';
import type { MessagingError } from '../app/protocol';
import type { ErrorCode } from '../core/errors';
import { notImplemented } from '../core/not-implemented';
import type { Result } from '../core/result';
import type { RequestOutcome } from './permissions';

/** The tab the popup was opened on (its URL is known through activeTab). */
export type PopupTab = { readonly id: number; readonly url: string };

export type MarkThisSiteClick = {
  /** The user's answer to the prompt; on `failed` the popup offers grant.html (D-229). */
  readonly permission: Promise<RequestOutcome>;
  /** The background's answer: the group was added (or why not). */
  readonly reply: Promise<Result<Result<Committed, ErrorCode>, MessagingError>>;
};

/** The popup's "Mark this site" click handler (REQ-POP-006, D-229). */
export function markThisSiteClick(_tab: PopupTab): MarkThisSiteClick | undefined {
  return notImplemented();
}
