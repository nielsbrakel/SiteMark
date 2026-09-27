import type { UrlPattern } from '@/core/model/schema';
import { firstMatchingPattern } from '@/core/url/group-match';
import { matchUrlPattern, type UrlPatternValue } from '@/core/url/match';
import { parseUrl } from '@/core/url/url-parts';
import { checkPatternInput, type PatternInput } from './pattern-draft';

/** What the live URL tester shows (REQ-URL-007). `number` counts from 1. */
export type UrlTestResult =
  | { readonly kind: 'empty' }
  | { readonly kind: 'invalid' }
  | { readonly kind: 'match'; readonly number: number; readonly pattern: UrlPattern }
  | { readonly kind: 'draft' }
  | { readonly kind: 'none' };

/** The pattern being typed, if it is valid (nothing is prompted for or sent). */
function draftValue(input: PatternInput): UrlPatternValue | undefined {
  if (!input.value.trim()) return undefined;
  const checked = checkPatternInput(input);
  if (!checked.ok) return undefined;
  const { draft } = checked;
  return draft.kind === 'wildcard' ? draft : { ...draft, origins: checked.origins };
}

/** The first stored pattern that matches `url`, else whether the pattern being typed would. */
export function testUrl(
  url: string,
  patterns: readonly UrlPattern[],
  draft: PatternInput,
): UrlTestResult {
  if (!url.trim()) return { kind: 'empty' };
  const parts = parseUrl(url.trim());
  if (!parts) return { kind: 'invalid' };
  const pattern = firstMatchingPattern(patterns, parts);
  if (pattern) return { kind: 'match', number: patterns.indexOf(pattern) + 1, pattern };
  const typed = draftValue(draft);
  return typed && matchUrlPattern(typed, parts) ? { kind: 'draft' } : { kind: 'none' };
}
