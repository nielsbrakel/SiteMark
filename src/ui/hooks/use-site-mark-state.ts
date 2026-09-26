import type { MessagingError } from '../../app/protocol';
import type { SiteMarkState } from '../../core/model/schema';
import { notImplemented } from '../../core/not-implemented';
import type { Result } from '../../core/result';

/**
 * Why there is no state to show: the background didn't answer (`MessagingError`), its reply isn't a
 * valid state (`stateInvalid`), or the stored data can't be read (`stateUnreadable`).
 */
export type StateViewError = MessagingError | 'stateInvalid' | 'stateUnreadable';

export type SiteMarkStateView =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly state: SiteMarkState }
  /** Written by a newer SiteMark: nothing can be shown or changed (REQ-DATA-007). */
  | { readonly status: 'readOnly'; readonly schemaVersion: number }
  | { readonly status: 'error'; readonly error: StateViewError };

/** Where a page reads the state from; never writes (D-220). */
export type StateSource = {
  /** The background's read-only view (`getState`). */
  getState(): Promise<Result<SiteMarkState, MessagingError>>;
  /** The raw stored value, `undefined` when nothing is stored. */
  readStored(): Promise<unknown>;
  /** Calls `listener` with each newly stored raw value; returns an unsubscribe function. */
  watch(listener: (raw: unknown) => void): () => void;
};

export function useSiteMarkState(_source?: StateSource): SiteMarkStateView {
  return notImplemented();
}
