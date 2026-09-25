import type { RegexErrorCode, UrlPatternErrorCode } from '../errors';
import type { Brand } from '../ids';
import { notImplemented } from '../not-implemented';
import { ok, type Result } from '../result';
import { memoize } from './memo';
import { type ParsedWildcard, parseWildcard } from './parse';
import type { UrlParts } from './url-parts';
import { matchWildcard } from './wildcard-match';

/**
 * A browser match pattern used for permissions (spec §7): `(*|http|https)://[*.]host/*`, canonical
 * (no port, lowercase ASCII host) and never broad. Only this module produces one.
 */
export type OriginPattern = Brand<string, 'OriginPattern'>;

/** The origin a wildcard pattern needs (REQ-URL-005): port dropped, path `/*`, `*.` kept. */
export function toOriginPattern(pattern: ParsedWildcard): OriginPattern {
  const host = `${pattern.includeSubdomains ? '*.' : ''}${pattern.host}`;
  return `${pattern.scheme}://${host}/*` as OriginPattern;
}

/** Validates origin input (any wildcard pattern, e.g. `https://example.com`) into its origin. */
export function parseOriginPattern(input: string): Result<OriginPattern, UrlPatternErrorCode> {
  const parsed = parseWildcard(input);
  return parsed.ok ? ok(toOriginPattern(parsed.value)) : parsed;
}

const parseOrigin = memoize(parseWildcard);

/** Is `value` an origin pattern in canonical form? For schemas of stored and imported state. */
export function isOriginPattern(value: unknown): value is OriginPattern {
  if (typeof value !== 'string') return false;
  const parsed = parseOrigin(value);
  return parsed.ok && toOriginPattern(parsed.value) === value;
}

/** Does the URL fall under the origin pattern (any port, any path)? */
export function originMatches(origin: OriginPattern, url: UrlParts): boolean {
  const parsed = parseOrigin(origin);
  return parsed.ok && matchWildcard(parsed.value, url);
}

/**
 * Validates the origins of a regex pattern (REQ-URL-004): 1…20 distinct origins, each in canonical
 * form. Duplicates (after canonicalization) are dropped.
 */
export function validateRegexOrigins(
  _origins: readonly string[],
): Result<OriginPattern[], RegexErrorCode | UrlPatternErrorCode> {
  return notImplemented();
}
