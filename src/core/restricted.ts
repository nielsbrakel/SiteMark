import { notImplemented } from './not-implemented';

/**
 * Whether `url` is a page where the browser won't let SiteMark run: anything that isn't http(s)
 * (browser pages, other extensions, `file:`, `view-source:`, `data:`), the extension stores, and PDFs
 * that open in the built-in viewer (REQ-POP-005, REQ-ENV-003). Only a hint for the popup: a failed
 * `scripting.executeScript` is the ground truth. Pure string parsing, since core has no `URL` global.
 */
export function isKnownRestrictedUrl(_url: string): boolean {
  return notImplemented();
}
