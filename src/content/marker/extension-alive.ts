import { browser } from 'wxt/browser';

/**
 * False once this content script is orphaned: after an extension update, reload or removal the old
 * script keeps running, but its `runtime.id` disappears (REQ-RND-012).
 */
export function isExtensionAlive(): boolean {
  try {
    return Boolean(browser?.runtime?.id);
  } catch {
    return false;
  }
}
