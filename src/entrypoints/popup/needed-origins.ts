import { originsOfSiteGroup } from '@/core/data/origins';
import type { SiteMarkState } from '@/core/model/schema';
import { activeGroups } from '@/core/url/group-match';
import { type OriginPattern, originMatches } from '@/core/url/origin';
import { parseUrl } from '@/core/url/url-parts';

/**
 * The origins the page needs for its marks to show on every visit (REQ-POP-004): those of the
 * active groups that cover the URL. A regex pattern's other origins aren't this page's business.
 */
export function neededOrigins(state: SiteMarkState, url: string): OriginPattern[] {
  const parts = parseUrl(url);
  if (!parts) return [];
  const origins = activeGroups(state, url)
    .flatMap(originsOfSiteGroup)
    .filter((origin) => originMatches(origin, parts));
  return [...new Set(origins)].sort();
}
