import type { SiteGroup, SiteMarkState } from '../model/schema';
import { notImplemented } from '../not-implemented';
import type { UrlPatternValue } from './match';
import type { UrlParts } from './url-parts';

/** A group as far as matching is concerned. */
type MatchableGroup = Pick<SiteGroup, 'enabled' | 'patterns' | 'excludes'>;

/**
 * The first pattern (in list order) that matches the URL, or `undefined`. The live tester shows
 * it (REQ-URL-007).
 */
export function firstMatchingPattern<P extends UrlPatternValue>(
  _patterns: readonly P[],
  _url: string | UrlParts,
): P | undefined {
  return notImplemented();
}

/** Does one of the group's patterns match the URL? Ignores `enabled` and excludes (REQ-URL-006). */
export function patternMatches(_group: MatchableGroup, _url: string | UrlParts): boolean {
  return notImplemented();
}

/** Does one of the group's exclude patterns match the URL (REQ-URL-008)? */
export function isExcluded(_group: MatchableGroup, _url: string | UrlParts): boolean {
  return notImplemented();
}

/** enabled ∧ patternMatches ∧ not excluded: the groups that render (REQ-URL-006, REQ-URL-008). */
export function isActive(_group: MatchableGroup, _url: string | UrlParts): boolean {
  return notImplemented();
}

/** The active groups for the URL, by priority (list order). */
export function activeGroups(_state: SiteMarkState, _url: string): SiteGroup[] {
  return notImplemented();
}

/** Every group with a matching pattern, enabled or not, by priority: what the popup lists. */
export function matchingGroups(_state: SiteMarkState, _url: string): SiteGroup[] {
  return notImplemented();
}
