import { notImplemented } from '../../core/not-implemented';
import type { Permissions, ScriptRegistrar, Tabs, Unsubscribe } from '../ports';
import type { SyncRegistration } from './sync-registration';

export type GrantDeps = {
  readonly syncRegistration: SyncRegistration;
  readonly registrar: Pick<ScriptRegistrar, 'getRegistered'>;
  readonly tabs: Pick<Tabs, 'list' | 'inject'>;
  /** The marker bundle (src/platform/registration.ts `markerFiles()`). */
  readonly markerFiles: readonly string[];
};

/** Completes a grant (D-229): sync the registration, then inject the marker into open tabs. */
export function completeGrant(_deps: GrantDeps, _origins: readonly string[]): Promise<void> {
  return notImplemented();
}

/** Keeps the registration in step with grants and revocations, wherever they come from. */
export function watchPermissions(
  _permissions: Pick<Permissions, 'onAdded' | 'onRemoved'>,
  _deps: GrantDeps,
): Unsubscribe {
  return notImplemented();
}
