import type { RegexErrorCode, UrlPatternErrorCode } from '../errors';
import { assertNever, ok, type Result } from '../result';
import { memoize } from './memo';
import { type OriginPattern, originMatches, validateRegexOrigins } from './origin';
import { normalizeWildcard, parseWildcard } from './parse';
import { compileRegex, validateRegex } from './regex-safety';
import { parseUrl, type UrlParts } from './url-parts';
import { matchWildcard } from './wildcard-match';

/** A stored URL pattern without its id (spec §7 `UrlPattern`). */
export type UrlPatternValue =
  | { readonly kind: 'wildcard'; readonly value: string }
  | { readonly kind: 'regex'; readonly value: string; readonly origins: readonly OriginPattern[] };

/** A pattern as the user (or an import) wrote it, before validation. */
export type UrlPatternDraft =
  | { readonly kind: 'wildcard'; readonly value: string }
  | { readonly kind: 'regex'; readonly value: string; readonly origins: readonly string[] };

/** A regex only runs on URLs (without the fragment) of at most this many characters. */
const MAX_REGEX_URL_LENGTH = 2048;

const parseCachedWildcard = memoize(parseWildcard);

function matchRegex(source: string, origins: readonly OriginPattern[], url: UrlParts): boolean {
  if (url.href.length > MAX_REGEX_URL_LENGTH) return false;
  if (!origins.some((origin) => originMatches(origin, url))) return false;
  return compileRegex(source)?.test(url.href) ?? false;
}

/**
 * Does the URL match the pattern (REQ-URL-001, REQ-URL-004)? A regex runs only on URLs of at most
 * 2048 characters (without the fragment) and only after one of its origins matches. Invalid or
 * unsafe stored patterns never match. Parsed and compiled patterns are cached.
 */
export function matchUrlPattern(pattern: UrlPatternValue, url: string | UrlParts): boolean {
  const parts = typeof url === 'string' ? parseUrl(url) : url;
  if (!parts) return false;
  switch (pattern.kind) {
    case 'wildcard': {
      const parsed = parseCachedWildcard(pattern.value);
      return parsed.ok && matchWildcard(parsed.value, parts);
    }
    case 'regex':
      return matchRegex(pattern.value, pattern.origins, parts);
    default:
      return assertNever(pattern);
  }
}

function normalizeRegex(
  value: string,
  origins: readonly string[],
): Result<UrlPatternValue, UrlPatternErrorCode | RegexErrorCode> {
  const source = validateRegex(value);
  if (!source.ok) return source;
  const valid = validateRegexOrigins(origins);
  return valid.ok ? ok({ kind: 'regex', value: source.value, origins: valid.value }) : valid;
}

/** Validates a pattern for storage and returns its canonical form (REQ-URL-003, REQ-URL-004). */
export function normalizeUrlPattern(
  draft: UrlPatternDraft,
): Result<UrlPatternValue, UrlPatternErrorCode | RegexErrorCode> {
  switch (draft.kind) {
    case 'wildcard': {
      const value = normalizeWildcard(draft.value);
      return value.ok ? ok({ kind: 'wildcard', value: value.value }) : value;
    }
    case 'regex':
      return normalizeRegex(draft.value, draft.origins);
    default:
      return assertNever(draft);
  }
}
