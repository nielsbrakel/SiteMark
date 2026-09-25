import { describe, expect, it } from 'vitest';
import type { SiteGroupId } from '../ids';
import { emptyState } from '../model/defaults';
import { parseState, type SiteGroup, type SiteMarkState } from '../model/schema';
import { err, type Result } from '../result';
import { aSiteGroup, aState, aWildcardPattern } from '../testing/builders';
import { times } from '../testing/schema-results';
import { fixedIdGen } from '../testing/test-doubles';
import {
  createSiteGroup,
  deleteSiteGroup,
  moveSiteGroup,
  renameSiteGroup,
  setSiteGroupEnabled,
} from './groups';

// Reducers get deeply frozen states: a reducer that mutates its input throws in strict mode.

const MISSING = 'grp-missing0' as SiteGroupId;

function frozen<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) frozen(child);
    Object.freeze(value);
  }
  return value;
}

function stateWith(...siteGroups: SiteGroup[]): SiteMarkState {
  return frozen(aState({ revision: 7, siteGroups }));
}

/** The new state; fails the test with the error code when the reducer refused. */
function applied(result: Result<SiteMarkState, unknown>): SiteMarkState {
  if (!result.ok) expect.fail(`expected ok, got ${String(result.error)}`);
  expect(parseState(result.value)).toEqual({ ok: true, value: result.value });
  return result.value;
}

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
