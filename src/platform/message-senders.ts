import type { Browser } from 'wxt/browser';
import type { ContentSender } from '../app/protocol';
import { notImplemented } from '../core/not-implemented';

export type MessageSender = Browser.runtime.MessageSender;

/** Sent by one of SiteMark's own extension pages (popup, options, grant, background). */
export function isExtensionPage(_sender: MessageSender): boolean {
  return notImplemented();
}

/** The tab, URL and origin of a SiteMark content script in a top frame, or `undefined`. */
export function contentSenderOf(_sender: MessageSender): ContentSender | undefined {
  return notImplemented();
}
