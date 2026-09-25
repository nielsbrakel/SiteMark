import type { EntityId, IdGen } from '../ids';
import type { SiteGroup, UrlPattern } from '../model/schema';

// Every ID may appear once in the whole state (spec §7). A merge keeps the IDs of an import file,
// except where a local site group that stays already uses one: that item gets a fresh ID.

const LISTS = ['patterns', 'excludes', 'marks'] as const;

/** The IDs of a site group and of its patterns, excludes and marks. */
export function idsOfSiteGroup(group: SiteGroup): EntityId[] {
  return [group.id, ...LISTS.flatMap((list) => group[list].map((item) => item.id))];
}

/**
 * Returns `group` with a fresh ID for each ID in `taken`, and adds every ID it keeps or mints to
 * `taken`, so later groups can't reuse them either.
 */
export function withFreeIds(group: SiteGroup, taken: Set<EntityId>, idGen: IdGen): SiteGroup {
  const free = <I extends EntityId>(id: I, mint: () => I): I => {
    const next = taken.has(id) ? mint() : id;
    taken.add(next);
    return next;
  };
  const freePattern = (pattern: UrlPattern): UrlPattern => ({
    ...pattern,
    id: free(pattern.id, () => idGen.patternId()),
  });
  return {
    ...group,
    id: free(group.id, () => idGen.siteGroupId()),
    patterns: group.patterns.map(freePattern),
    excludes: group.excludes.map(freePattern),
    marks: group.marks.map((mark) => ({ ...mark, id: free(mark.id, () => idGen.markId()) })),
  };
}
