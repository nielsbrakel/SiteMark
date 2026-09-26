import { describe, expect, it } from 'vitest';
import type { SiteGroupId } from '../ids';
import { emptyState } from '../model/defaults';
import type { SiteGroup, SiteMarkState } from '../model/schema';
import { err } from '../result';
import {
  anElementMark,
  aPageMark,
  aRegexPattern,
  aSiteGroup,
  aState,
  aWildcardPattern,
} from '../testing/builders';
import { applied, frozen, MISSING_GROUP_ID as MISSING, stateWith } from '../testing/reducers';
import { times } from '../testing/schema-results';
import { fixedIdGen } from '../testing/test-doubles';
import {
  createSiteGroup,
  deleteSiteGroup,
  moveSiteGroup,
  renameSiteGroup,
  restoreSiteGroup,
  setSiteGroupEnabled,
} from './groups';

const namesOf = (state: SiteMarkState) => state.siteGroups.map((group) => group.name);
const create = (state: SiteMarkState, name: string) =>
  createSiteGroup(state, { type: 'createSiteGroup', name }, { idGen: fixedIdGen() });

describe('REQ-GRP-001 create a site group at the bottom of the list', () => {
  it('adds an empty, disabled group with a new ID after the existing groups', () => {
    const [first, second] = [aSiteGroup({ name: 'Prod' }), aSiteGroup({ name: 'Test' })];
    const next = applied(create(stateWith(first, second), 'Staging'));
    expect(next).toEqual({
      ...aState({ revision: 7 }),
      siteGroups: [
        first,
        second,
        {
          id: 'group0000001',
          name: 'Staging',
          enabled: false,
          patterns: [],
          excludes: [],
          marks: [],
        },
      ],
    });
  });

  it('works on the empty state and leaves the revision to the dispatcher', () => {
    const next = applied(create(frozen(emptyState()), 'Prod'));
    expect(namesOf(next)).toEqual(['Prod']);
    expect(next.revision).toBe(0);
  });

  it('strips invisible and bidi characters and trims the name', () => {
    expect(namesOf(applied(create(stateWith(), ' ‮Stag​ing\n ')))).toEqual(['Staging']);
  });

  it.each([
    ['empty', ''],
    ['blank after cleaning', ' ​⁦ '],
    ['41 characters', 'x'.repeat(41)],
  ])('refuses a name that is %s', (_case, name) => {
    expect(create(stateWith(), name)).toEqual(err('siteGroupNameInvalid'));
  });

  it('accepts a name of exactly 40 characters (after trimming)', () => {
    expect(namesOf(applied(create(stateWith(), ` ${'x'.repeat(40)} `)))).toEqual(['x'.repeat(40)]);
  });
});

describe('REQ-GRP-002 at most 200 site groups', () => {
  it('creates the 200th group but refuses the 201st', () => {
    const full = applied(create(stateWith(...times(199, () => aSiteGroup())), 'Last'));
    expect(full.siteGroups).toHaveLength(200);
    expect(create(frozen(full), 'One too many')).toEqual(err('siteGroupLimitReached'));
  });
});

describe('REQ-GRP-001 rename a site group', () => {
  const rename = (state: SiteMarkState, id: SiteGroupId, name: string) =>
    renameSiteGroup(state, { type: 'renameSiteGroup', id, name });

  it('renames only that group and keeps everything else', () => {
    const [prod, test] = [aSiteGroup({ name: 'Prod' }), aSiteGroup({ name: 'Test' })];
    const next = applied(rename(stateWith(prod, test), test.id, '  Acceptance‎ '));
    expect(next.siteGroups).toEqual([prod, { ...test, name: 'Acceptance' }]);
  });

  it.each(['', '​', 'x'.repeat(41)])('refuses the invalid name %j', (name) => {
    const group = aSiteGroup();
    expect(rename(stateWith(group), group.id, name)).toEqual(err('siteGroupNameInvalid'));
  });

  it('reports a site group that no longer exists', () => {
    expect(rename(stateWith(aSiteGroup()), MISSING, 'Prod')).toEqual(err('siteGroupNotFound'));
  });
});

describe('REQ-GRP-001 delete a site group', () => {
  const remove = (state: SiteMarkState, id: SiteGroupId) =>
    deleteSiteGroup(state, { type: 'deleteSiteGroup', id });

  it('removes the group and keeps the order of the others', () => {
    const [a, b, c] = [aSiteGroup(), aSiteGroup(), aSiteGroup()];
    expect(applied(remove(stateWith(a, b, c), b.id)).siteGroups).toEqual([a, c]);
  });

  it('can delete the last remaining group', () => {
    const group = aSiteGroup();
    expect(applied(remove(stateWith(group), group.id)).siteGroups).toEqual([]);
  });

  it('reports a site group that no longer exists', () => {
    expect(remove(stateWith(aSiteGroup()), MISSING)).toEqual(err('siteGroupNotFound'));
  });
});

describe('REQ-GRP-003 REQ-GRP-002 enable or disable a site group', () => {
  const setEnabled = (state: SiteMarkState, id: SiteGroupId, enabled: boolean) =>
    setSiteGroupEnabled(state, { type: 'setSiteGroupEnabled', id, enabled });

  it('disables a group and keeps its patterns and marks', () => {
    const [group, other] = [aSiteGroup({ enabled: true }), aSiteGroup()];
    const next = applied(setEnabled(stateWith(group, other), group.id, false));
    expect(next.siteGroups).toEqual([{ ...group, enabled: false }, other]);
  });

  it('enables a disabled group that has a URL pattern', () => {
    const group = aSiteGroup({ enabled: false, patterns: [aWildcardPattern()] });
    const next = applied(setEnabled(stateWith(group), group.id, true));
    expect(next.siteGroups).toEqual([{ ...group, enabled: true }]);
  });

  it('refuses to enable a group without URL patterns (excludes do not count)', () => {
    const group = aSiteGroup({ enabled: false, patterns: [], excludes: [aWildcardPattern()] });
    expect(setEnabled(stateWith(group), group.id, true)).toEqual(err('siteGroupNeedsPattern'));
  });

  it.each([true, false])('setting enabled to its current value (%s) changes nothing', (enabled) => {
    const group = aSiteGroup({ enabled, patterns: enabled ? [aWildcardPattern()] : [] });
    expect(applied(setEnabled(stateWith(group), group.id, enabled)).siteGroups).toEqual([group]);
  });

  it('reports a site group that no longer exists', () => {
    expect(setEnabled(stateWith(aSiteGroup()), MISSING, false)).toEqual(err('siteGroupNotFound'));
  });
});

describe('REQ-GRP-004 reorder site groups: priority is list order', () => {
  const groups = times(4, () => aSiteGroup());
  /** Moves the group at `'abcd'.indexOf(letter)` and spells the new order in letters. */
  const move = (letter: string, toIndex: number) => {
    const id = groups['abcd'.indexOf(letter)]?.id ?? MISSING;
    const cmd = { type: 'moveSiteGroup', id, toIndex } as const;
    const next = applied(moveSiteGroup(stateWith(...groups), cmd));
    return next.siteGroups.map((group) => 'abcd'.charAt(groups.indexOf(group))).join('');
  };

  it.each([
    ['d', 0, 'dabc'],
    ['a', 3, 'bcda'],
    ['a', 2, 'bcad'],
    ['c', 1, 'acbd'],
    ['b', 2, 'acbd'],
    ['b', 1, 'abcd'],
  ])('moves %s to index %i → %s', (name, toIndex, order) => {
    expect(move(name, toIndex)).toBe(order);
  });

  it.each([
    ['a', -1, 'abcd', 'Move up on the first group'],
    ['d', 4, 'abcd', 'Move down on the last group'],
    ['b', 99, 'acdb', 'past the end'],
    ['c', -5, 'cabd', 'before the start'],
  ])('clamps: %s to %i → %s (%s)', (name, toIndex, order) => {
    expect(move(name, toIndex)).toBe(order);
  });

  it('reports a site group that no longer exists', () => {
    const state = stateWith(aSiteGroup());
    const cmd = { type: 'moveSiteGroup', id: MISSING, toIndex: 0 } as const;
    expect(moveSiteGroup(state, cmd)).toEqual(err('siteGroupNotFound'));
  });
});

describe('REQ-GRP-001 restore a deleted site group (undo)', () => {
  const restore = (state: SiteMarkState, group: SiteGroup, index: number) =>
    restoreSiteGroup(state, { type: 'restoreSiteGroup', group, index });
  const [a, c] = [aSiteGroup({ name: 'A' }), aSiteGroup({ name: 'C' })];
  const b = aSiteGroup({
    name: 'B',
    excludes: [aWildcardPattern({ value: 'https://prod.example.com/status' })],
    marks: [aPageMark(), anElementMark()],
  });

  it('puts the group back where it was, with its IDs, patterns, excludes and marks', () => {
    const cmd = { type: 'deleteSiteGroup', id: b.id } as const;
    const deleted = applied(deleteSiteGroup(stateWith(a, b, c), cmd));
    expect(applied(restore(frozen(deleted), b, 1)).siteGroups).toEqual([a, b, c]);
  });

  it.each([
    [-1, ['B', 'A', 'C']],
    [0, ['B', 'A', 'C']],
    [2, ['A', 'C', 'B']],
    [99, ['A', 'C', 'B']],
  ])('clamps the index %i to the list', (index, names) => {
    expect(namesOf(applied(restore(stateWith(a, c), b, index)))).toEqual(names);
  });

  it('keeps a disabled group disabled', () => {
    const off = aSiteGroup({ enabled: false, patterns: [] });
    expect(applied(restore(stateWith(a), off, 1)).siteGroups).toEqual([a, off]);
  });

  it('stores its patterns in canonical form, like new ones', () => {
    const pattern = aWildcardPattern({ value: 'Prod.Example.com' });
    const group = aSiteGroup({ patterns: [pattern] });
    const [restored] = applied(restore(stateWith(), group, 0)).siteGroups;
    expect(restored?.patterns).toEqual([{ ...pattern, value: '*://prod.example.com/*' }]);
  });

  it.each([
    [
      'a broad URL pattern',
      { patterns: [aWildcardPattern({ value: '*.com' })] },
      'patternTooBroad',
    ],
    ['an unsafe regex', { patterns: [aRegexPattern({ value: '(a+)+$' })] }, 'regexUnsafe'],
    ['a broad exclude', { excludes: [aWildcardPattern({ value: '*.co.uk' })] }, 'patternTooBroad'],
  ])('refuses %s', (_case, overrides, code) => {
    expect(restore(stateWith(a), aSiteGroup(overrides), 0)).toEqual(err(code));
  });

  it('refuses a group whose ID is already in the list (a second Undo)', () => {
    expect(restore(stateWith(a, b), b, 0)).toEqual(err('siteGroupExists'));
  });

  it('refuses when there are 200 site groups already', () => {
    const full = stateWith(...times(200, () => aSiteGroup()));
    expect(restore(full, b, 0)).toEqual(err('siteGroupLimitReached'));
  });
});
