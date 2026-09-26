import type { SiteGroupErrorCode, UrlPatternErrorCode } from '../errors';
import { markThisSiteGroup, type SiteOrigin } from '../model/defaults';
import type { SiteMarkState } from '../model/schema';
import { err, ok, type Result } from '../result';
import { formatWildcard, parseWildcard } from '../url/parse';
import type { CommandDeps, CommandOf } from './command';
import { appendSiteGroup } from './groups';

type MarkThisSiteResult = Result<SiteMarkState, SiteGroupErrorCode | UrlPatternErrorCode>;

/**
 * Checks the pattern "Mark this site" builds from the origin: it must parse, and the origin must
 * already be one exact, canonical host (lowercase punycode, no `*.`, no path), as `URL.hostname`
 * gives it. Otherwise the group's name and ribbon would not show the host it matches.
 */
function checkPattern(
  pattern: string,
  { hostname }: SiteOrigin,
): Result<void, UrlPatternErrorCode> {
  const parsed = parseWildcard(pattern);
  if (!parsed.ok) return parsed;
  const { host, includeSubdomains, path } = parsed.value;
  const isExact = host === hostname && !includeSubdomains && path === '/*';
  return isExact && formatWildcard(parsed.value) === pattern
    ? ok(undefined)
    : err('patternInvalidHost');
}

/**
 * Adds the "Mark this site" group for `origin` at the bottom (REQ-POP-006). It adds a new group
 * every time, even when a group for the same origin exists: the user asked for it and can delete
 * the extra group in the options page. The caller requests the origin's permission.
 */
export function markThisSite(
  state: SiteMarkState,
  { origin }: CommandOf<'markThisSite'>,
  { idGen }: CommandDeps,
): MarkThisSiteResult {
  const group = markThisSiteGroup(origin, idGen);
  for (const pattern of group.patterns) {
    const checked = checkPattern(pattern.value, origin);
    if (!checked.ok) return checked;
  }
  return appendSiteGroup(state, group);
}
