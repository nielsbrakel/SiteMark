import type { OriginPattern, SiteGroup, SiteMarkState } from '../model/schema';
import { notImplemented } from '../not-implemented';

// The origins that URL patterns need (REQ-URL-005), for grants (REQ-DATA-005) and registration.

/** The origins the group's URL patterns need (excludes need none), deduplicated and sorted. */
export function originsOfSiteGroup(_group: SiteGroup): OriginPattern[] {
  return notImplemented();
}

/** The origins of every site group, enabled or not. */
export function originsOfState(_state: SiteMarkState): OriginPattern[] {
  return notImplemented();
}

/** The origins of the enabled site groups: what the marker may be registered for (REQ-PRIV-003). */
export function originsOfEnabledSiteGroups(_state: SiteMarkState): OriginPattern[] {
  return notImplemented();
}

/** The origins `after` needs that `before` did not: one batched request (REQ-DATA-005). */
export function originsToRequest(_before: SiteMarkState, _after: SiteMarkState): OriginPattern[] {
  return notImplemented();
}
