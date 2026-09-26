import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { EntityId, IdGen, MarkId, PatternId, SiteGroupId } from '../ids';
import { parseState, type SiteMarkState } from '../model/schema';
import { settings, siteGroups, siteMarkState } from '../testing/arbitraries';
import { assertProperty } from '../testing/property';
import { fixedIdGen } from '../testing/test-doubles';
import { idsOfSiteGroup } from './free-ids';
import type { ImportData } from './import';
import { mergeImport } from './merge-import';

// T-058: a merge keeps every ID unique and the state valid, whatever IDs the two sides share. The
// generators draw IDs from a small shared pool, so groups, patterns and marks collide often.

const incoming: fc.Arbitrary<ImportData> = fc.record({ siteGroups: siteGroups(), settings });

const allIds = (state: SiteMarkState) => state.siteGroups.flatMap(idsOfSiteGroup);

function merged(local: SiteMarkState, file: ImportData): SiteMarkState {
  const result = mergeImport(local, file, { idGen: fixedIdGen() });
  expect(result.ok).toBe(true);
  return (result as { value: SiteMarkState }).value;
}

describe('REQ-DATA-004 property: merge keeps IDs unique', () => {
  it('yields a valid state in which every ID appears once', () => {
    assertProperty(
      fc.property(siteMarkState, incoming, (local, file) => {
        const state = merged(local, file);
        const ids = allIds(state);
        expect(new Set(ids).size).toBe(ids.length);
        expect(parseState(state)).toEqual({ ok: true, value: state });
      }),
    );
  });

  it('keeps the local settings and revision and every local group, in place', () => {
    assertProperty(
      fc.property(siteMarkState, incoming, (local, file) => {
        const state = merged(local, file);
        expect(state.settings).toBe(local.settings);
        expect(state.revision).toBe(local.revision);
        expect(state.siteGroups.slice(0, local.siteGroups.length).map((g) => g.id)).toEqual(
          local.siteGroups.map((g) => g.id),
        );
      }),
    );
  });

  it('adds exactly the file groups whose ID is not a local group', () => {
    assertProperty(
      fc.property(siteMarkState, incoming, (local, file) => {
        const localIds = new Set(local.siteGroups.map((group) => group.id));
        const added = file.siteGroups.filter((group) => !localIds.has(group.id));
        const state = merged(local, file);
        expect(state.siteGroups.length).toBe(local.siteGroups.length + added.length);
        expect(state.siteGroups.slice(local.siteGroups.length).map((g) => g.name)).toEqual(
          added.map((group) => group.name),
        );
      }),
    );
  });
});

/**
 * An IdGen that first mints `used` (IDs the states already hold), then fresh ones. Real IDs are
 * random, so this is only unlikely, not impossible: the merge must not trust a minted ID blindly.
 */
function collidingIdGen(used: readonly EntityId[]): IdGen {
  const queue = [...used];
  const fresh = fixedIdGen();
  const next = <I extends EntityId>(mint: () => I) => (queue.shift() as I | undefined) ?? mint();
  return {
    siteGroupId: () => next<SiteGroupId>(fresh.siteGroupId),
    markId: () => next<MarkId>(fresh.markId),
    patternId: () => next<PatternId>(fresh.patternId),
  };
}

describe('REQ-DATA-004 property: merge keeps IDs unique when the IdGen mints an ID in use', () => {
  it('mints again until the ID is free', () => {
    assertProperty(
      fc.property(siteMarkState, incoming, (local, file) => {
        const idGen = collidingIdGen([
          ...allIds(local),
          ...file.siteGroups.flatMap(idsOfSiteGroup),
        ]);
        const result = mergeImport(local, file, { idGen });
        expect(result.ok).toBe(true);
        const state = (result as { value: SiteMarkState }).value;
        const ids = allIds(state);
        expect(new Set(ids).size).toBe(ids.length);
      }),
    );
  });
});
