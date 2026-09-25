import type { SiteGroupErrorCode } from '../errors';
import type { MarkId } from '../ids';
import {
  type Mark,
  type MarkDraft,
  parseMarkDraft,
  type SiteGroup,
  type SiteMarkState,
} from '../model/schema';
import { err, ok, type Result } from '../result';
import type { CommandDeps, CommandOf } from './command';
import { updateGroup } from './groups';

// Mark reducers (REQ-GRP-002, REQ-MARK-001): 0..50 marks per site group, each validated by the
// mark schema and stored the way the schema reads it (cleaned label, lowercase hex).

const MAX_MARKS = 50;

type MarkResult = Result<SiteMarkState, SiteGroupErrorCode>;
type GroupChange = Result<SiteGroup, SiteGroupErrorCode>;

/** The draft as the schema reads it, with `id`; `markInvalid` when the schema refuses it. */
function validMark(draft: MarkDraft, id: () => MarkId): Result<Mark, SiteGroupErrorCode> {
  const parsed = parseMarkDraft(draft);
  return parsed.ok ? ok({ ...parsed.value, id: id() }) : err('markInvalid');
}

function indexOf(group: SiteGroup, id: MarkId): number {
  return group.marks.findIndex((mark) => mark.id === id);
}

export function addMark(
  state: SiteMarkState,
  { groupId, mark }: CommandOf<'addMark'>,
  { idGen }: CommandDeps,
): MarkResult {
  return updateGroup(state, groupId, (group): GroupChange => {
    if (group.marks.length >= MAX_MARKS) return err('markLimitReached');
    const added = validMark(mark, () => idGen.markId());
    return added.ok ? ok({ ...group, marks: [...group.marks, added.value] }) : added;
  });
}

/** Replaces the whole mark, which keeps its ID and position. */
export function updateMark(
  state: SiteMarkState,
  { groupId, markId, mark }: CommandOf<'updateMark'>,
): MarkResult {
  return updateGroup(state, groupId, (group): GroupChange => {
    const index = indexOf(group, markId);
    if (index < 0) return err('markNotFound');
    const updated = validMark(mark, () => markId);
    return updated.ok ? ok({ ...group, marks: group.marks.with(index, updated.value) }) : updated;
  });
}

export function removeMark(
  state: SiteMarkState,
  { groupId, markId }: CommandOf<'removeMark'>,
): MarkResult {
  return updateGroup(state, groupId, (group): GroupChange => {
    const index = indexOf(group, markId);
    if (index < 0) return err('markNotFound');
    return ok({ ...group, marks: group.marks.toSpliced(index, 1) });
  });
}

/** Moves a mark so that it ends up at `toIndex`, clamped to the list (like `moveSiteGroup`). */
export function moveMark(
  state: SiteMarkState,
  { groupId, markId, toIndex }: CommandOf<'moveMark'>,
): MarkResult {
  return updateGroup(state, groupId, (group): GroupChange => {
    const index = indexOf(group, markId);
    const mark = group.marks[index];
    if (!mark) return err('markNotFound');
    const rest = group.marks.toSpliced(index, 1);
    const target = Math.min(Math.max(toIndex, 0), rest.length);
    return ok({ ...group, marks: rest.toSpliced(target, 0, mark) });
  });
}
