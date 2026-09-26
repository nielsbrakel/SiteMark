import type { Committed } from '../app/command-queue';
import type { MessagingError } from '../app/protocol';
import type { ErrorCode } from '../core/errors';
import type { SiteOrigin } from '../core/model/defaults';
import type { Result } from '../core/result';
import { type RequestOutcome, requestOrigins } from './permissions';
import { sendToBackground } from './send-message';

/** The tab the popup was opened on (its URL is known through activeTab). */
export type PopupTab = { readonly id: number; readonly url: string };

export type MarkThisSiteClick = {
  /** The user's answer to the prompt; on `failed` the popup offers grant.html (D-229). */
  readonly permission: Promise<RequestOutcome>;
  /** The background's answer: the group was added (or why not). */
  readonly reply: Promise<Result<Result<Committed, ErrorCode>, MessagingError>>;
};

/** The host and port of an http(s) page, or `undefined`. */
function siteOrigin(url: string): SiteOrigin | undefined {
  try {
    const { protocol, hostname, port } = new URL(url);
    return protocol === 'http:' || protocol === 'https:' ? { hostname, port } : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The popup's "Mark this site" click handler (REQ-POP-006, D-229). Call it synchronously in the
 * click: it prompts for the host first, then sends markThisSite without waiting for the answer.
 * The background adds the group and shows it on the tab whatever the user answers. `undefined`
 * (and nothing happens) on pages that aren't http(s).
 */
export function markThisSiteClick(tab: PopupTab): MarkThisSiteClick | undefined {
  const origin = siteOrigin(tab.url);
  if (!origin) return undefined;
  const permission = requestOrigins([`*://${origin.hostname}/*`]);
  const reply = sendToBackground('markThisSite', { tabId: tab.id, origin });
  return { permission, reply };
}
