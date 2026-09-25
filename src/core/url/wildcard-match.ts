import { notImplemented } from '../not-implemented';
import type { ParsedWildcard } from './parse';
import type { UrlParts } from './url-parts';

/** Does the URL match the wildcard pattern (REQ-URL-001)? Scheme, host, port, then path glob. */
export function matchWildcard(_pattern: ParsedWildcard, _url: UrlParts): boolean {
  return notImplemented();
}
