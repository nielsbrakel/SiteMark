import type { RegexErrorCode, UrlPatternErrorCode } from '../errors';
import { notImplemented } from '../not-implemented';
import type { Result } from '../result';
import type { OriginPattern } from './origin';
import type { UrlParts } from './url-parts';

/** A stored URL pattern without its id (spec §7 `UrlPattern`). */
export type UrlPatternValue =
  | { readonly kind: 'wildcard'; readonly value: string }
  | { readonly kind: 'regex'; readonly value: string; readonly origins: readonly OriginPattern[] };

/** A pattern as the user (or an import) wrote it, before validation. */
export type UrlPatternDraft =
  | { readonly kind: 'wildcard'; readonly value: string }
  | { readonly kind: 'regex'; readonly value: string; readonly origins: readonly string[] };

/**
 * Does the URL match the pattern (REQ-URL-001, REQ-URL-004)? A regex runs only on URLs of at most
 * 2048 characters (without the fragment) and only after one of its origins matches. Invalid or
 * unsafe stored patterns never match. Parsed and compiled patterns are cached.
 */
export function matchUrlPattern(_pattern: UrlPatternValue, _url: string | UrlParts): boolean {
  return notImplemented();
}

/** Validates a pattern for storage and returns its canonical form (REQ-URL-003, REQ-URL-004). */
export function normalizeUrlPattern(
  _draft: UrlPatternDraft,
): Result<UrlPatternValue, UrlPatternErrorCode | RegexErrorCode> {
  return notImplemented();
}
