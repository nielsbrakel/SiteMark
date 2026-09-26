import type { SiteGroupErrorCode } from '../errors';
import type { IdGen } from '../ids';
import type { SiteGroup, SiteMarkState } from '../model/schema';
import { cleanText } from '../model/text';
import { err, type Result } from '../result';
import type { CommandDeps, CommandOf } from './command';
import { appendSiteGroup, NAME_MAX } from './groups';

const COPY_SUFFIX = ' copy';

/**
 * `<name> copy`, cutting the name so the result fits in 40 characters. `cleanText` drops half an
 * emoji left by the cut and a trailing space.
 */
function copyName(name: string): string {
  return `${cleanText(name.slice(0, NAME_MAX - COPY_SUFFIX.length))}${COPY_SUFFIX}`;
}

/** A copy with new IDs for the group and everything in it, minted in list order. */
function copyOf(group: SiteGroup, idGen: IdGen): SiteGroup {
  return {
    id: idGen.siteGroupId(),
    name: copyName(group.name),
    enabled: false,
    patterns: group.patterns.map((pattern) => ({ ...pattern, id: idGen.patternId() })),
    excludes: group.excludes.map((pattern) => ({ ...pattern, id: idGen.patternId() })),
    marks: group.marks.map((mark) => ({ ...mark, id: idGen.markId() })),
  };
}

/**
 * Adds a copy of site group `id` at the bottom, like a new group (REQ-GRP-001, REQ-GRP-006). The
 * copy starts disabled until the user turns it on and grants its origins.
 */
export function duplicateSiteGroup(
  state: SiteMarkState,
  { id }: CommandOf<'duplicateSiteGroup'>,
  { idGen }: CommandDeps,
): Result<SiteMarkState, SiteGroupErrorCode> {
  const group = state.siteGroups.find((candidate) => candidate.id === id);
  if (!group) return err('siteGroupNotFound');
  return appendSiteGroup(state, copyOf(group, idGen));
}
