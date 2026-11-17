import type { SiteMarkState } from '../model/schema';
import { isExcluded, patternMatches } from './group-match';
import { parseUrl } from './url-parts';

/**
 * Is a site group switched off for this URL (REQ-POP-010)? A group with a matching pattern that
 * the URL doesn't exclude, but that is not enabled: the marker doesn't run there, yet the toolbar
 * icon still says SiteMark knows the site.
 */
export function hasOffGroup(state: SiteMarkState, url: string): boolean {
  const parts = parseUrl(url);
  return (
    parts !== undefined &&
    state.siteGroups.some(
      (group) => !group.enabled && patternMatches(group, parts) && !isExcluded(group, parts),
    )
  );
}
