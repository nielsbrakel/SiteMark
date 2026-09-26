import type { SiteGroup, SiteMarkState, UrlPattern } from '../model/schema';
import { assertNever } from '../result';
import type { OriginPattern } from '../url/origin';
import { toOriginPattern } from '../url/origin';
import { parseWildcard } from '../url/parse';

// The origins that URL patterns need (REQ-URL-005), for grants (REQ-DATA-005) and registration.
// Excludes only narrow a match, so they need no origin.

function originsOfPattern(pattern: UrlPattern): readonly OriginPattern[] {
  switch (pattern.kind) {
    case 'wildcard': {
      const parsed = parseWildcard(pattern.value);
      return parsed.ok ? [toOriginPattern(parsed.value)] : [];
    }
    case 'regex':
      return pattern.origins;
    default:
      return assertNever(pattern);
  }
}

function originsOf(siteGroups: readonly SiteGroup[]): OriginPattern[] {
  const unique = new Set(siteGroups.flatMap((group) => group.patterns.flatMap(originsOfPattern)));
  return [...unique].sort();
}

/** The origins the group's URL patterns need (excludes need none), deduplicated and sorted. */
export function originsOfSiteGroup(group: SiteGroup): OriginPattern[] {
  return originsOf([group]);
}

/** The origins of every site group, enabled or not. */
export function originsOfState(state: SiteMarkState): OriginPattern[] {
  return originsOf(state.siteGroups);
}

/** The origins of the enabled site groups: what the marker may be registered for (REQ-PRIV-003). */
export function originsOfEnabledSiteGroups(state: SiteMarkState): OriginPattern[] {
  return originsOf(state.siteGroups.filter((group) => group.enabled));
}

/**
 * The origins `after` needs that `before` did not, deduplicated and sorted: one batched request
 * (REQ-DATA-005). Compared as exact origin patterns; the caller still skips granted ones.
 */
export function originsToRequest(before: SiteMarkState, after: SiteMarkState): OriginPattern[] {
  const known = new Set(originsOfState(before));
  return originsOfState(after).filter((origin) => !known.has(origin));
}
