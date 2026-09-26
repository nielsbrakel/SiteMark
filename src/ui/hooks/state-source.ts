import { browser } from 'wxt/browser';
import type { MessagingError } from '../../app/protocol';
import type { SiteMarkState } from '../../core/model/schema';
import type { Result } from '../../core/result';
import { sendToBackground } from '../../platform/send-message';

/** Where a page reads the state from; never writes (D-220). */
export type StateSource = {
  /** The background's read-only view (`getState`). */
  getState(): Promise<Result<SiteMarkState, MessagingError>>;
  /** The raw stored value, `undefined` when nothing is stored. */
  readStored(): Promise<unknown>;
  /** Calls `listener` with each newly stored raw value; returns an unsubscribe function. */
  watch(listener: (raw: unknown) => void): () => void;
};

/** The storage key the background writes (src/platform/state-repo.ts). */
const STATE_KEY = 'sitemark:state';

/**
 * Extension pages are trusted contexts: they may read `storage.local` and observe its changes, but
 * only the background writes it. The live push is `storage.local.onChanged` for the state key.
 */
export const browserStateSource: StateSource = {
  getState: () => sendToBackground('getState'),
  readStored: async () => (await browser.storage.local.get(STATE_KEY))[STATE_KEY],
  watch(listener) {
    const onChanged = (changes: Record<string, { newValue?: unknown }>) => {
      const change = changes[STATE_KEY];
      // A removed key (newValue undefined) is not a state: the background never removes it.
      if (change?.newValue !== undefined && change.newValue !== null) listener(change.newValue);
    };
    browser.storage.local.onChanged.addListener(onChanged);
    return () => browser.storage.local.onChanged.removeListener(onChanged);
  },
};
