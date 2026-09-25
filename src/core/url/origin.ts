import type { UrlPatternErrorCode } from '../errors';
import type { Brand } from '../ids';
import { notImplemented } from '../not-implemented';
import type { Result } from '../result';
import type { ParsedWildcard } from './parse';
import type { UrlParts } from './url-parts';

/**
 * A browser match pattern used for permissions (spec §7): `(*|http|https)://[*.]host/*`, canonical
 * (no port, lowercase ASCII host) and never broad. Only this module produces one.
 */
export type OriginPattern = Brand<string, 'OriginPattern'>;

/** The origin a wildcard pattern needs (REQ-URL-005): port dropped, path `/*`, `*.` kept. */
export function toOriginPattern(_pattern: ParsedWildcard): OriginPattern {
  return notImplemented();
}

/** Does the URL fall under the origin pattern (any port, any path)? */
export function originMatches(_origin: OriginPattern, _url: UrlParts): boolean {
  return notImplemented();
}

/** Validates origin input (any wildcard pattern, e.g. `https://example.com`) into its origin. */
export function parseOriginPattern(_input: string): Result<OriginPattern, UrlPatternErrorCode> {
  return notImplemented();
}

/** Is `value` an origin pattern in canonical form? For schemas of stored and imported state. */
export function isOriginPattern(_value: unknown): _value is OriginPattern {
  return notImplemented();
}
