import { type Browser, browser } from 'wxt/browser';
import type { ContentSender } from '../app/protocol';

// Who sent a runtime message (REQ-SEC-003). Only `sender` is trusted, never the payload
// (REQ-SEC-001). Content-safe: the content script's listener uses it too.

export type MessageSender = Browser.runtime.MessageSender;

const isOwn = (sender: MessageSender): boolean => sender.id === browser.runtime.id;

/** Sent by one of SiteMark's own extension pages (popup, options, grant, background). */
export function isExtensionPage(sender: MessageSender): boolean {
  // `getURL('/')` ends in a slash, so `chrome-extension://<id>.evil/` can't pass the prefix check.
  return isOwn(sender) && sender.url?.startsWith(browser.runtime.getURL('/')) === true;
}

/** The origin of an http(s) page, or `undefined` (extension pages, files, garbage). */
function webOrigin(url: string): string | undefined {
  try {
    const { protocol, origin } = new URL(url);
    return protocol === 'http:' || protocol === 'https:' ? origin : undefined;
  } catch {
    return undefined;
  }
}

/** The tab, URL and origin of a SiteMark content script in a top frame, or `undefined`. */
export function contentSenderOf(sender: MessageSender): ContentSender | undefined {
  const tabId = sender.tab?.id;
  const { url } = sender;
  if (!isOwn(sender) || sender.frameId !== 0 || tabId === undefined || url === undefined) {
    return undefined;
  }
  const origin = webOrigin(url);
  return origin === undefined ? undefined : { tabId, url, origin };
}
