import type { SiteMarkState } from '../model/schema';
import type { Result } from '../result';
import type { CommandDeps, CommandOf } from './command';
import { addToList, type PatternErrorCode, removeFromList, updateInList } from './pattern-list';

// Exclude pattern reducers (REQ-URL-008): the same validation and limit as URL patterns, but an
// empty exclude list never disables a site group.

type PatternResult = Result<SiteMarkState, PatternErrorCode>;

export function addExclude(
  state: SiteMarkState,
  { groupId, draft }: CommandOf<'addExclude'>,
  { idGen }: CommandDeps,
): PatternResult {
  return addToList(state, groupId, 'excludes', draft, idGen);
}

export function updateExclude(
  state: SiteMarkState,
  { groupId, patternId, draft }: CommandOf<'updateExclude'>,
): PatternResult {
  return updateInList(state, groupId, 'excludes', patternId, draft);
}

export function removeExclude(
  state: SiteMarkState,
  { groupId, patternId }: CommandOf<'removeExclude'>,
): PatternResult {
  return removeFromList(state, groupId, 'excludes', patternId);
}
