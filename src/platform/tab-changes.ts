import type { Unsubscribe } from '../app/ports';
import { notImplemented } from '../core/not-implemented';

/**
 * Calls `onChange` whenever a tab's URL changes (`tabs.onUpdated`, REQ-POP-010). No `tabs`
 * permission is needed: the browser reports a URL only on granted origins. Register it
 * synchronously at the top level, like every background listener.
 */
export function listenForTabChanges(_onChange: () => void): Unsubscribe {
  return notImplemented();
}
