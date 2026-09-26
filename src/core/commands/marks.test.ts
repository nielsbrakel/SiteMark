import { describe, expect, it } from 'vitest';
import type { MarkId, SiteGroupId } from '../ids';
import type { ElementMark, Hex, PageMark, SiteMarkState } from '../model/schema';
import { err } from '../result';
import { anElementMark, aPageMark, aSiteGroup } from '../testing/builders';
import { applied, MISSING_GROUP_ID, stateWith } from '../testing/reducers';
import { times } from '../testing/schema-results';
import { fixedIdGen } from '../testing/test-doubles';
import { addMark, moveMark, removeMark, updateMark } from './marks';

type Draft = Parameters<typeof addMark>[1]['mark'];

const MISSING_MARK_ID = 'mrk-missing0' as MarkId;

function draftOf<M extends PageMark | ElementMark>(mark: M): Omit<M, 'id'> {
  const { id: _id, ...draft } = mark;
  return draft;
}

const add = (state: SiteMarkState, groupId: SiteGroupId, mark: Draft) =>
  addMark(state, { type: 'addMark', groupId, mark }, { idGen: fixedIdGen() });
const update = (state: SiteMarkState, groupId: SiteGroupId, markId: MarkId, mark: Draft) =>
  updateMark(state, { type: 'updateMark', groupId, markId, mark });
const remove = (state: SiteMarkState, groupId: SiteGroupId, markId: MarkId) =>
  removeMark(state, { type: 'removeMark', groupId, markId });

const page = draftOf(aPageMark());
const element = draftOf(anElementMark());
const invalidDrafts: [string, Draft][] = [
  ['has no effects', { ...page, effects: {} }],
  ['has an empty selector', { ...element, target: { kind: 'element', selector: '' } }],
  ['is not a hex color', { ...page, color: 'red' as Hex }],
  [
    'puts an element effect on the page',
    { ...page, effects: { outline: { widthPx: 2, style: 'solid', pulse: false } } } as Draft,
  ],
];

describe('REQ-GRP-002 REQ-MARK-001 add a mark to a site group', () => {
  it('adds the mark with a new ID at the end of the list', () => {
    const existing = aPageMark();
    const [group, other] = [aSiteGroup({ marks: [existing] }), aSiteGroup()];
    const next = applied(add(stateWith(group, other), group.id, element));
    const added = { ...element, id: 'mark00000001' };
    expect(next.siteGroups).toEqual([{ ...group, marks: [existing, added] }, other]);
  });

  it('stores the mark as the schema reads it: lowercase hex, cleaned label', () => {
    const group = aSiteGroup();
    const draft = { ...page, color: '#C93A2E' as Hex, label: ' Prod‮ ' };
    const next = applied(add(stateWith(group), group.id, draft));
    expect(next.siteGroups[0]?.marks).toEqual([
      { ...page, id: 'mark00000001', color: '#c93a2e', label: 'Prod' },
    ]);
  });

  it.each(invalidDrafts)('never stores a mark that %s', (_case, draft) => {
    const group = aSiteGroup();
    expect(add(stateWith(group), group.id, draft)).toEqual(err('markInvalid'));
  });

  it('adds the 50th mark but refuses the 51st', () => {
    const almost = aSiteGroup({ marks: times(49, () => aPageMark()) });
    const full = applied(add(stateWith(almost), almost.id, page));
    expect(full.siteGroups[0]?.marks).toHaveLength(50);
    expect(add(full, almost.id, page)).toEqual(err('markLimitReached'));
  });

  it('reports a site group that no longer exists', () => {
    expect(add(stateWith(aSiteGroup()), MISSING_GROUP_ID, page)).toEqual(err('siteGroupNotFound'));
  });
});

describe('REQ-MARK-001 edit a mark', () => {
  it('replaces the whole mark in place and keeps its ID', () => {
    const [a, b] = [aPageMark({ label: 'Old' }), aPageMark()];
    const group = aSiteGroup({ marks: [a, b] });
    const next = applied(update(stateWith(group), group.id, a.id, element));
    expect(next.siteGroups).toEqual([{ ...group, marks: [{ ...element, id: a.id }, b] }]);
  });

  it.each(invalidDrafts)('never stores an edit that %s', (_case, draft) => {
    const mark = aPageMark();
    const group = aSiteGroup({ marks: [mark] });
    expect(update(stateWith(group), group.id, mark.id, draft)).toEqual(err('markInvalid'));
  });

  it('reports a mark or site group that no longer exists', () => {
    const mark = aPageMark();
    const group = aSiteGroup({ marks: [mark] });
    const state = stateWith(group);
    expect(update(state, group.id, MISSING_MARK_ID, page)).toEqual(err('markNotFound'));
    expect(update(state, MISSING_GROUP_ID, mark.id, page)).toEqual(err('siteGroupNotFound'));
  });
});

describe('REQ-MARK-001 remove a mark', () => {
  it('removes the mark and keeps the order of the others', () => {
    const [a, b, c] = [aPageMark(), anElementMark(), aPageMark()];
    const group = aSiteGroup({ marks: [a, b, c] });
    const next = applied(remove(stateWith(group), group.id, b.id));
    expect(next.siteGroups).toEqual([{ ...group, marks: [a, c] }]);
  });

  it('reports a mark or site group that no longer exists', () => {
    const mark = aPageMark();
    const group = aSiteGroup({ marks: [mark] });
    const state = stateWith(group);
    expect(remove(state, group.id, MISSING_MARK_ID)).toEqual(err('markNotFound'));
    expect(remove(state, MISSING_GROUP_ID, mark.id)).toEqual(err('siteGroupNotFound'));
  });
});

describe('REQ-GRP-005 reorder marks: mark order within a site group', () => {
  const marks = times(4, () => aPageMark());
  const group = aSiteGroup({ marks });
  /** Moves the mark at `'abcd'.indexOf(letter)` and spells the new order in letters. */
  const move = (letter: string, toIndex: number) => {
    const markId = marks['abcd'.indexOf(letter)]?.id ?? MISSING_MARK_ID;
    const command = { type: 'moveMark', groupId: group.id, markId, toIndex } as const;
    const next = applied(moveMark(stateWith(group), command));
    const ids = marks.map((mark) => mark.id);
    return (next.siteGroups[0]?.marks ?? []).map((mark) => 'abcd'.charAt(ids.indexOf(mark.id)));
  };

  it.each([
    ['d', 0, 'dabc'],
    ['a', 2, 'bcad'],
    ['b', 1, 'abcd'],
    ['a', -1, 'abcd'],
    ['c', 99, 'abdc'],
  ])('moves %s to index %i → %s (clamped to the list)', (letter, toIndex, order) => {
    expect(move(letter, toIndex).join('')).toBe(order);
  });

  it('reports a mark or site group that no longer exists', () => {
    const state = stateWith(group);
    const markId = marks[0]?.id ?? MISSING_MARK_ID;
    const moveTo = (groupId: SiteGroupId, id: MarkId) =>
      moveMark(state, { type: 'moveMark', groupId, markId: id, toIndex: 0 });
    expect(moveTo(group.id, MISSING_MARK_ID)).toEqual(err('markNotFound'));
    expect(moveTo(MISSING_GROUP_ID, markId)).toEqual(err('siteGroupNotFound'));
  });
});
