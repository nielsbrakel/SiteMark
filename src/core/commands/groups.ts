import type { RegexErrorCode, SiteGroupErrorCode, UrlPatternErrorCode } from '../errors';
import type { SiteGroupId } from '../ids';
import type { SiteGroup, SiteMarkState } from '../model/schema';
import { cleanText } from '../model/text';
import { err, ok, type Result } from '../result';
import type { CommandDeps, CommandOf } from './command';
import { recheckPatterns } from './stored-pattern';

// Reducers for site groups (REQ-GRP-001…004). They leave `revision` to the dispatcher.

const MAX_SITE_GROUPS = 200;
export const NAME_MAX = 40;

type GroupResult = Result<SiteMarkState, SiteGroupErrorCode>;

/** A name as stored: cleaned (see `cleanText`), then 1..40 characters. */
function siteGroupName(input: string): Result<string, SiteGroupErrorCode> {
  const name = cleanText(input);
  // biome-ignore lint/security/noSecrets: an error code, not a secret.
  return name.length > 0 && name.length <= NAME_MAX ? ok(name) : err('siteGroupNameInvalid');
}

function indexOf(state: SiteMarkState, id: SiteGroupId): number {
  return state.siteGroups.findIndex((group) => group.id === id);
}

/** `index` clamped to the insert positions of `list` (0…length). */
function clamped(index: number, list: readonly unknown[]): number {
  return Math.min(Math.max(index, 0), list.length);
}

/** Replaces site group `id` with `change(group)`, or fails when the group no longer exists. */
export function updateGroup<E>(
  state: SiteMarkState,
  id: SiteGroupId,
  change: (group: SiteGroup) => Result<SiteGroup, E>,
): Result<SiteMarkState, E | 'siteGroupNotFound'> {
  const index = indexOf(state, id);
  const group = state.siteGroups[index];
  if (!group) return err('siteGroupNotFound');
  const changed = change(group);
  if (!changed.ok) return changed;
  return ok({ ...state, siteGroups: state.siteGroups.with(index, changed.value) });
}

/** Adds `group` at the bottom (REQ-GRP-001), or fails when there are 200 already (REQ-GRP-002). */
export function appendSiteGroup(state: SiteMarkState, group: SiteGroup): GroupResult {
  if (state.siteGroups.length >= MAX_SITE_GROUPS) return err('siteGroupLimitReached');
  return ok({ ...state, siteGroups: [...state.siteGroups, group] });
}

export function createSiteGroup(
  state: SiteMarkState,
  command: CommandOf<'createSiteGroup'>,
  { idGen }: CommandDeps,
): GroupResult {
  const name = siteGroupName(command.name);
  if (!name.ok) return name;
  return appendSiteGroup(state, {
    id: idGen.siteGroupId(),
    name: name.value,
    enabled: false,
    patterns: [],
    excludes: [],
    marks: [],
  });
}

export function renameSiteGroup(
  state: SiteMarkState,
  { id, name }: CommandOf<'renameSiteGroup'>,
): GroupResult {
  return updateGroup(state, id, (group) => {
    const cleaned = siteGroupName(name);
    return cleaned.ok ? ok({ ...group, name: cleaned.value }) : cleaned;
  });
}

export function deleteSiteGroup(
  state: SiteMarkState,
  { id }: CommandOf<'deleteSiteGroup'>,
): GroupResult {
  const index = indexOf(state, id);
  if (index < 0) return err('siteGroupNotFound');
  return ok({ ...state, siteGroups: state.siteGroups.toSpliced(index, 1) });
}

export function setSiteGroupEnabled(
  state: SiteMarkState,
  { id, enabled }: CommandOf<'setSiteGroupEnabled'>,
): GroupResult {
  return updateGroup(state, id, (group) =>
    enabled && group.patterns.length === 0
      ? err('siteGroupNeedsPattern')
      : ok({ ...group, enabled }),
  );
}

export function moveSiteGroup(
  state: SiteMarkState,
  { id, toIndex }: CommandOf<'moveSiteGroup'>,
): GroupResult {
  const index = indexOf(state, id);
  const group = state.siteGroups[index];
  if (!group) return err('siteGroupNotFound');
  const rest = state.siteGroups.toSpliced(index, 1);
  return ok({ ...state, siteGroups: rest.toSpliced(clamped(toIndex, rest), 0, group) });
}

/**
 * Puts a deleted site group back (the options page's Undo, REQ-GRP-001). Its patterns come from the
 * page, so they are checked again; a group that is already back is refused.
 */
export function restoreSiteGroup(
  state: SiteMarkState,
  { group, index }: CommandOf<'restoreSiteGroup'>,
): Result<SiteMarkState, SiteGroupErrorCode | UrlPatternErrorCode | RegexErrorCode> {
  if (indexOf(state, group.id) >= 0) return err('siteGroupExists');
  if (state.siteGroups.length >= MAX_SITE_GROUPS) return err('siteGroupLimitReached');
  const patterns = recheckPatterns(group.patterns);
  if (!patterns.ok) return patterns;
  const excludes = recheckPatterns(group.excludes);
  if (!excludes.ok) return excludes;
  const restored = { ...group, patterns: patterns.value, excludes: excludes.value };
  const at = clamped(index, state.siteGroups);
  return ok({ ...state, siteGroups: state.siteGroups.toSpliced(at, 0, restored) });
}
