import { matchGlob } from './glob';
import type { ParsedWildcard } from './parse';
import type { UrlParts } from './url-parts';

function schemeMatches(pattern: ParsedWildcard, url: UrlParts): boolean {
  if (pattern.scheme === '*') return url.scheme === 'http' || url.scheme === 'https';
  return url.scheme === pattern.scheme;
}

function hostMatches(pattern: ParsedWildcard, url: UrlParts): boolean {
  if (url.host === pattern.host) return true;
  return pattern.includeSubdomains && url.host.endsWith(`.${pattern.host}`);
}

/** Does the URL match the wildcard pattern (REQ-URL-001)? Scheme, host, port, then path glob. */
export function matchWildcard(pattern: ParsedWildcard, url: UrlParts): boolean {
  if (!(schemeMatches(pattern, url) && hostMatches(pattern, url))) return false;
  if (pattern.port !== undefined && pattern.port !== url.port) return false;
  const query = url.query === undefined ? '' : `?${url.query}`;
  return matchGlob(pattern.path, pattern.matchesQuery ? url.path + query : url.path);
}
