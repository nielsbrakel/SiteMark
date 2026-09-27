import type { SiteGroup, UrlPattern } from '@/core/model/schema';
import { firstMatchingPattern } from '@/core/url/group-match';
import { matchUrlPattern, type UrlPatternValue } from '@/core/url/match';
import { parseUrl, type UrlParts } from '@/core/url/url-parts';
import { checkPatternInput, type PatternInput } from './pattern-draft';

/** What the live URL tester shows (REQ-URL-007). `number` counts from 1. */
export type UrlTestResult =
  | { readonly kind: 'empty' }
  | { readonly kind: 'invalid' }
  | { readonly kind: 'match'; readonly number: number; readonly pattern: UrlPattern }
  | {
      readonly kind: 'excluded';
      readonly number: number;
      readonly excludeNumber: number;
      readonly exclude: UrlPattern;
    }
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

type TestedGroup = Pick<SiteGroup, 'patterns' | 'excludes'>;

/** A stored pattern's match, or the exclude that suppresses it (REQ-URL-008). */
function storedMatch(group: TestedGroup, parts: UrlParts): UrlTestResult | undefined {
  const pattern = firstMatchingPattern(group.patterns, parts);
  if (!pattern) return undefined;
  const number = group.patterns.indexOf(pattern) + 1;
  const exclude = firstMatchingPattern(group.excludes, parts);
  if (!exclude) return { kind: 'match', number, pattern };
  return { kind: 'excluded', number, excludeNumber: group.excludes.indexOf(exclude) + 1, exclude };
}

/** The first stored pattern that matches `url`, else whether the pattern being typed would. */
export function testUrl(url: string, group: TestedGroup, draft: PatternInput): UrlTestResult {
  if (!url.trim()) return { kind: 'empty' };
  const parts = parseUrl(url.trim());
  if (!parts) return { kind: 'invalid' };
  const stored = storedMatch(group, parts);
  if (stored) return stored;
  const typed = draftValue(draft);
  return typed && matchUrlPattern(typed, parts) ? { kind: 'draft' } : { kind: 'none' };
}
