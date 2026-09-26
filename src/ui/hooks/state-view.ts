import type { MessagingError } from '../../app/protocol';
import { migrate } from '../../core/data/migrate';
import { parseState, type SiteMarkState } from '../../core/model/schema';
import { assertNever, type Result } from '../../core/result';

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

/** The view of a raw stored value, through the same migration as the background (D-224). */
export function viewOfStored(raw: unknown): SiteMarkStateView {
  const migrated = migrate(raw);
  if (migrated.ok) return { status: 'ready', state: migrated.value.state };
  const failure = migrated.error;
  switch (failure.code) {
    case 'stateReadOnly':
      return { status: 'readOnly', schemaVersion: failure.schemaVersion };
    case 'stateUnreadable':
      return { status: 'error', error: 'stateUnreadable' };
    default:
      return assertNever(failure);
  }
}

/** The view of a `getState` reply, re-validated: replies are data, not trusted types. */
export function viewOfReply(reply: Result<SiteMarkState, MessagingError>): SiteMarkStateView {
  if (!reply.ok) return { status: 'error', error: reply.error };
  const parsed = parseState(reply.value);
  return parsed.ok
    ? { status: 'ready', state: parsed.value }
    : { status: 'error', error: 'stateInvalid' };
}

/** Keeps the newer of two states when both are ready, so a late, older answer can't win. */
export function newerView(current: SiteMarkStateView, next: SiteMarkStateView): SiteMarkStateView {
  const isOlder =
    current.status === 'ready' &&
    next.status === 'ready' &&
    next.state.revision < current.state.revision;
  return isOlder ? current : next;
}
