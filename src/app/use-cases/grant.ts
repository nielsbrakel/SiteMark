import { type OriginPattern, originMatches, parseOriginPattern } from '../../core/url/origin';
import { parseUrl } from '../../core/url/url-parts';
import type { Permissions, ScriptRegistrar, TabInfo, Tabs, Unsubscribe } from '../ports';
import type { SyncRegistration } from './sync-registration';

// D-229, plan §3.2 steps 3–4: whoever prompted (an extension page, grant.html or the browser's own
// UI), the background completes the grant. Registration covers future page loads; open tabs get
// the marker injected, which REQ-RND-012 makes safe even if one already runs there.

export type GrantDeps = {
  readonly syncRegistration: SyncRegistration;
  readonly registrar: Pick<ScriptRegistrar, 'getRegistered'>;
  readonly tabs: Pick<Tabs, 'list' | 'inject'>;
  /** The marker bundle (src/platform/registration.ts `markerFiles()`). */
  readonly markerFiles: readonly string[];
};

function toOrigins(values: readonly string[]): OriginPattern[] {
  return values.flatMap((value) => {
    const parsed = parseOriginPattern(value);
    return parsed.ok ? [parsed.value] : [];
  });
}

function matchesAny(tab: TabInfo, origins: readonly OriginPattern[]): boolean {
  const parts = tab.url === undefined ? undefined : parseUrl(tab.url);
  return parts !== undefined && origins.some((origin) => originMatches(origin, parts));
}

/**
 * Completes a grant (D-229): sync the registration, then inject the marker into open tabs on the
 * granted origins that the marker is now registered for. Never rejects: a tab that refuses the
 * injection (a restricted page) is skipped.
 */
export async function completeGrant(deps: GrantDeps, origins: readonly string[]): Promise<void> {
  await deps.syncRegistration();
  const granted = toOrigins(origins);
  const registered = toOrigins((await deps.registrar.getRegistered())?.matches ?? []);
  if (granted.length === 0 || registered.length === 0) return;
  const tabs = await deps.tabs.list();
  const targets = tabs.filter((tab) => matchesAny(tab, granted) && matchesAny(tab, registered));
  await Promise.all(targets.map((tab) => deps.tabs.inject(tab.id, deps.markerFiles)));
}

/** Keeps the registration in step with grants and revocations, wherever they come from. */
export function watchPermissions(
  permissions: Pick<Permissions, 'onAdded' | 'onRemoved'>,
  deps: GrantDeps,
): Unsubscribe {
  const offAdded = permissions.onAdded((origins) => void completeGrant(deps, origins));
  const offRemoved = permissions.onRemoved(() => void deps.syncRegistration());
  return () => {
    offAdded();
    offRemoved();
  };
}
