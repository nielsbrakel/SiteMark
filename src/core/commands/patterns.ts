import type { SiteGroupId } from '../ids';
import type { SiteMarkState } from '../model/schema';
import { ok, type Result } from '../result';
import type { CommandDeps, CommandOf, CommandOutcome } from './command';
import { addToList, type PatternErrorCode, removeFromList, updateInList } from './pattern-list';

// URL pattern reducers (REQ-GRP-002, REQ-URL-003, REQ-URL-009). Invalid and broad patterns are
// never stored; the error code says why.

type PatternResult = Result<SiteMarkState, PatternErrorCode>;

export function addPattern(
  state: SiteMarkState,
  { groupId, draft }: CommandOf<'addPattern'>,
  { idGen }: CommandDeps,
): PatternResult {
  return addToList(state, groupId, 'patterns', draft, idGen);
}

export function updatePattern(
  state: SiteMarkState,
  { groupId, patternId, draft }: CommandOf<'updatePattern'>,
): PatternResult {
  return updateInList(state, groupId, 'patterns', patternId, draft);
}

function isEnabled(state: SiteMarkState, id: SiteGroupId): boolean {
  return state.siteGroups.some((group) => group.id === id && group.enabled);
}

/**
 * Removes a URL pattern. Removing the last one disables an enabled site group and adds the
 * `siteGroupAutoDisabled` notice (REQ-GRP-002).
 */
export function removePattern(
  state: SiteMarkState,
  { groupId, patternId }: CommandOf<'removePattern'>,
): Result<CommandOutcome, PatternErrorCode> {
  const next = removeFromList(state, groupId, 'patterns', patternId);
  if (!next.ok) return next;
  const autoDisabled = isEnabled(state, groupId) && !isEnabled(next.value, groupId);
  return ok({ state: next.value, notices: autoDisabled ? ['siteGroupAutoDisabled'] : [] });
}
