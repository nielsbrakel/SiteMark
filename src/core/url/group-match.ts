import type { SiteGroup, SiteMarkState } from '../model/schema';
import { matchUrlPattern, type UrlPatternValue } from './match';
import { parseUrl, type UrlParts } from './url-parts';

/** A group as far as matching is concerned. */
type MatchableGroup = Pick<SiteGroup, 'enabled' | 'patterns' | 'excludes'>;

const toParts = (url: string | UrlParts): UrlParts | undefined =>
  typeof url === 'string' ? parseUrl(url) : url;

/**
 * The first pattern (in list order) that matches the URL, or `undefined`. The live tester shows
 * it (REQ-URL-007).
 */
export function firstMatchingPattern<P extends UrlPatternValue>(
  patterns: readonly P[],
  url: string | UrlParts,
): P | undefined {
  const parts = toParts(url);
  return parts && patterns.find((pattern) => matchUrlPattern(pattern, parts));
}

/** Does one of the group's patterns match the URL? Ignores `enabled` and excludes (REQ-URL-006). */
export function patternMatches(group: MatchableGroup, url: string | UrlParts): boolean {
  return firstMatchingPattern(group.patterns, url) !== undefined;
}

/** Does one of the group's exclude patterns match the URL (REQ-URL-008)? */
export function isExcluded(group: MatchableGroup, url: string | UrlParts): boolean {
  return firstMatchingPattern(group.excludes, url) !== undefined;
}

/** enabled ∧ patternMatches ∧ not excluded: the groups that render (REQ-URL-006, REQ-URL-008). */
export function isActive(group: MatchableGroup, url: string | UrlParts): boolean {
  const parts = toParts(url);
  return (
    parts !== undefined &&
    group.enabled &&
    patternMatches(group, parts) &&
    !isExcluded(group, parts)
  );
}

/** The active groups for the URL, by priority (list order). The URL is parsed once. */
export function activeGroups(state: SiteMarkState, url: string): SiteGroup[] {
  const parts = parseUrl(url);
  return parts ? state.siteGroups.filter((group) => isActive(group, parts)) : [];
}

/** Every group with a matching pattern, enabled or not, by priority: what the popup lists. */
export function matchingGroups(state: SiteMarkState, url: string): SiteGroup[] {
  const parts = parseUrl(url);
  return parts ? state.siteGroups.filter((group) => patternMatches(group, parts)) : [];
}
