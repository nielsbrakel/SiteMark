import type { RegexErrorCode, SiteGroupErrorCode, UrlPatternErrorCode } from '../errors';
import type { IdGen, PatternId, SiteGroupId } from '../ids';
import type { SiteGroup, SiteMarkState, UrlPattern } from '../model/schema';
import { err, ok, type Result } from '../result';
import { normalizeUrlPattern, type UrlPatternDraft, type UrlPatternValue } from '../url/match';
import { updateGroup } from './groups';

// Shared by the URL pattern and exclude reducers (REQ-GRP-002, REQ-URL-003, REQ-URL-008): both
// lists hold 0..50 patterns, validated and canonicalized by the URL engine before they are stored.

const MAX_PATTERNS = 50;

export type PatternList = 'patterns' | 'excludes';
export type PatternErrorCode = SiteGroupErrorCode | UrlPatternErrorCode | RegexErrorCode;
type PatternResult = Result<SiteMarkState, PatternErrorCode>;

const LIMIT_CODE = {
  patterns: 'patternLimitReached',
  excludes: 'excludeLimitReached',
} as const satisfies Record<PatternList, SiteGroupErrorCode>;

function stored(id: PatternId, pattern: UrlPatternValue): UrlPattern {
  return pattern.kind === 'wildcard'
    ? { id, kind: 'wildcard', value: pattern.value }
    : { id, kind: 'regex', value: pattern.value, origins: [...pattern.origins] };
}

/**
 * The group with a new list. A group without URL patterns can't stay enabled (REQ-GRP-002), so
 * emptying `patterns` disables it.
 */
function withList(group: SiteGroup, list: PatternList, items: UrlPattern[]): SiteGroup {
  return list === 'patterns'
    ? { ...group, patterns: items, enabled: group.enabled && items.length > 0 }
    : { ...group, excludes: items };
}

function indexIn(group: SiteGroup, list: PatternList, id: PatternId): number {
  return group[list].findIndex((pattern) => pattern.id === id);
}

export function addToList(
  state: SiteMarkState,
  groupId: SiteGroupId,
  list: PatternList,
  draft: UrlPatternDraft,
  idGen: IdGen,
): PatternResult {
  return updateGroup(state, groupId, (group): Result<SiteGroup, PatternErrorCode> => {
    if (group[list].length >= MAX_PATTERNS) return err(LIMIT_CODE[list]);
    const pattern = normalizeUrlPattern(draft);
    if (!pattern.ok) return pattern;
    return ok(withList(group, list, [...group[list], stored(idGen.patternId(), pattern.value)]));
  });
}

export function updateInList(
  state: SiteMarkState,
  groupId: SiteGroupId,
  list: PatternList,
  patternId: PatternId,
  draft: UrlPatternDraft,
): PatternResult {
  return updateGroup(state, groupId, (group): Result<SiteGroup, PatternErrorCode> => {
    const index = indexIn(group, list, patternId);
    if (index < 0) return err('patternNotFound');
    const pattern = normalizeUrlPattern(draft);
    if (!pattern.ok) return pattern;
    return ok(withList(group, list, group[list].with(index, stored(patternId, pattern.value))));
  });
}

export function removeFromList(
  state: SiteMarkState,
  groupId: SiteGroupId,
  list: PatternList,
  patternId: PatternId,
): PatternResult {
  return updateGroup(state, groupId, (group): Result<SiteGroup, PatternErrorCode> => {
    const index = indexIn(group, list, patternId);
    if (index < 0) return err('patternNotFound');
    return ok(withList(group, list, group[list].toSpliced(index, 1)));
  });
}
