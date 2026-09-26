import { appendSiteGroup } from '../../core/commands/groups';
import { addMark, updateMark } from '../../core/commands/marks';
import type { ErrorCode } from '../../core/errors';
import type { IdGen, MarkId } from '../../core/ids';
import type { SiteOrigin } from '../../core/model/defaults';
import type { ElementMark, SiteGroup, SiteMarkState } from '../../core/model/schema';
import { err, ok, type Result } from '../../core/result';
import { activeGroups } from '../../core/url/group-match';
import type { CommandQueue } from '../command-queue';
import type { ContentSender, SavePick } from '../protocol';
import { pickedMark, pickSiteGroup, repickedMark } from './pick-mark';

// The picker's save intent (REQ-PICK-005, REQ-SEC-001). The picker runs in an untrusted page, so
// the background decides everything from the sender: the pick goes to the chosen site group only
// when that group is active for the sender's URL, and to a new group for the sender's origin
// otherwise. The whole change is one queue transform, so a new group never ends up without its mark.

export type SavePickDeps = {
  readonly queue: Pick<CommandQueue, 'run'>;
  readonly idGen: IdGen;
};

type Change = Result<SiteMarkState, ErrorCode>;

/** `https://host:8443` → host and port ('' for the default port). */
function originOf(sender: ContentSender): SiteOrigin {
  const { hostname, port } = new URL(sender.origin);
  return { hostname, port };
}

function isElementMark(mark: { readonly target: { readonly kind: string } }): mark is ElementMark {
  return mark.target.kind === 'element';
}

/** Re-pick (REQ-PICK-007): only an element mark of a group active on the sender's URL. */
function repick(state: SiteMarkState, pick: SavePick, url: string, markId: MarkId): Change {
  for (const group of activeGroups(state, url)) {
    const mark = group.marks.find((candidate) => candidate.id === markId);
    if (mark && isElementMark(mark)) {
      const draft = repickedMark(mark, pick.selector);
      return updateMark(state, { type: 'updateMark', groupId: group.id, markId, mark: draft });
    }
  }
  return err('markNotFound');
}

function targetGroup(state: SiteMarkState, pick: SavePick, url: string): SiteGroup | undefined {
  return activeGroups(state, url).find((group) => group.id === pick.siteGroupId);
}

function addPick(
  state: SiteMarkState,
  pick: SavePick,
  sender: ContentSender,
  deps: SavePickDeps,
  markId: MarkId,
): Change {
  const origin = originOf(sender);
  const mark = pickedMark(pick, origin.hostname);
  const idGen = { ...deps.idGen, markId: () => markId };
  const existing = targetGroup(state, pick, sender.url);
  if (existing) return addMark(state, { type: 'addMark', groupId: existing.id, mark }, { idGen });
  const group = pickSiteGroup(origin, deps.idGen);
  const withGroup = appendSiteGroup(state, group);
  if (!withGroup.ok) return withGroup;
  return addMark(withGroup.value, { type: 'addMark', groupId: group.id, mark }, { idGen });
}

/** Saves a pick through the queue and returns the ID of the new (or re-picked) mark. */
export async function savePick(
  deps: SavePickDeps,
  pick: SavePick,
  sender: ContentSender,
): Promise<Result<MarkId, ErrorCode>> {
  const { repickMarkId } = pick;
  let markId = repickMarkId;
  const committed = await deps.queue.run((state) => {
    if (repickMarkId) return repick(state, pick, sender.url, repickMarkId);
    markId = deps.idGen.markId();
    return addPick(state, pick, sender, deps, markId);
  });
  if (!committed.ok) return committed;
  // The transform ran, so the ID is set.
  return ok(markId as MarkId);
}
