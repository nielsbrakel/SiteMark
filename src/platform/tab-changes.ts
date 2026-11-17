import { browser } from 'wxt/browser';
import type { Unsubscribe } from '../app/ports';

/**
 * Calls `onChange` whenever a tab's URL changes (`tabs.onUpdated`, REQ-POP-010). No `tabs`
 * permission is needed: the browser reports a URL only on granted origins. Register it
 * synchronously at the top level, like every background listener.
 */
export function listenForTabChanges(onChange: () => void): Unsubscribe {
  const listener = (_tabId: number, change: { url?: string | undefined }) => {
    if (change.url !== undefined) onChange();
  };
  browser.tabs.onUpdated.addListener(listener);
  return () => browser.tabs.onUpdated.removeListener(listener);
}
