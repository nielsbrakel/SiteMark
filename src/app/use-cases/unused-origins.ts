import { originsOfState } from '../../core/data/origins';
import type { SiteMarkState } from '../../core/model/schema';
import { type ParsedWildcard, parseWildcard } from '../../core/url/parse';

type Origin = Pick<ParsedWildcard, 'scheme' | 'host' | 'includeSubdomains'>;

function parseOrigin(input: string): Origin | undefined {
  const parsed = parseWildcard(input);
  return parsed.ok ? parsed.value : undefined;
}

/** Is `inner`'s host one of the hosts `outer` covers? */
function coversHost(outer: Origin, inner: Origin): boolean {
  return (
    outer.host === inner.host || (outer.includeSubdomains && inner.host.endsWith(`.${outer.host}`))
  );
}

/** Do the two origins share at least one URL? */
function overlaps(a: Origin, b: Origin): boolean {
  const schemes = a.scheme === '*' || b.scheme === '*' || a.scheme === b.scheme;
  return schemes && (coversHost(a, b) || coversHost(b, a));
}

/**
 * Granted origins that no pattern of any site group needs any more: what the revoke prompt offers
 * (REQ-PRIV-004). Disabled groups still count, since the user may enable them again. A grant that
 * shares any URL with a needed origin is kept, and a grant that isn't a readable origin (e.g.
 * `<all_urls>`) is never offered.
 */
export function unusedOrigins(state: SiteMarkState, granted: readonly string[]): string[] {
  const needed = originsOfState(state).flatMap((origin) => parseOrigin(origin) ?? []);
  return [...new Set(granted)].filter((origin) => {
    const parsed = parseOrigin(origin);
    return parsed !== undefined && !needed.some((use) => overlaps(parsed, use));
  });
}
