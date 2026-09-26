import type { RegexErrorCode, UrlPatternErrorCode } from '../errors';
import type { PatternId } from '../ids';
import type { UrlPattern } from '../model/schema';
import { ok, type Result } from '../result';
import { normalizeUrlPattern, type UrlPatternValue } from '../url/match';

// URL patterns as stored (REQ-URL-003, REQ-URL-009): always the URL engine's canonical form.

/** A validated pattern value with its ID, as stored. */
export function storedPattern(id: PatternId, pattern: UrlPatternValue): UrlPattern {
  return pattern.kind === 'wildcard'
    ? { id, kind: 'wildcard', value: pattern.value }
    : { id, kind: 'regex', value: pattern.value, origins: [...pattern.origins] };
}

/**
 * Patterns that come back from a page (e.g. an undone delete), checked and canonicalized like new
 * ones, with their IDs kept. The first invalid pattern's code refuses them all.
 */
export function recheckPatterns(
  patterns: readonly UrlPattern[],
): Result<UrlPattern[], UrlPatternErrorCode | RegexErrorCode> {
  const checked: UrlPattern[] = [];
  for (const pattern of patterns) {
    const value = normalizeUrlPattern(pattern);
    if (!value.ok) return value;
    checked.push(storedPattern(pattern.id, value.value));
  }
  return ok(checked);
}
