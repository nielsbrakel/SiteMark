import { describe, expect, it } from 'vitest';
import type { SiteGroupId } from '../ids';
import type { SiteMarkState } from '../model/schema';
import { err } from '../result';
import {
  anElementMark,
  aPageMark,
  aRegexPattern,
  aSiteGroup,
  aWildcardPattern,
} from '../testing/builders';
import { applied, MISSING_GROUP_ID, stateWith } from '../testing/reducers';
import { times } from '../testing/schema-results';
import { fixedIdGen } from '../testing/test-doubles';
import { duplicateSiteGroup } from './duplicate-group';

const duplicate = (state: SiteMarkState, id: SiteGroupId, idGen = fixedIdGen()) =>
  duplicateSiteGroup(state, { type: 'duplicateSiteGroup', id }, { idGen });

describe('REQ-GRP-006 duplicate a site group', () => {
  it('adds a disabled copy with new IDs at the bottom and leaves the original alone', () => {
    const [wildcard, regex] = [aWildcardPattern(), aRegexPattern()];
    const exclude = aWildcardPattern({ value: 'https://prod.example.com/health' });
    const [page, element] = [aPageMark(), anElementMark()];
    const original = aSiteGroup({
      name: 'Production',
      enabled: true,
      patterns: [wildcard, regex],
      excludes: [exclude],
      marks: [page, element],
    });
    const other = aSiteGroup({ name: 'Test' });

    const next = applied(duplicate(stateWith(original, other), original.id));

    expect(next.siteGroups).toEqual([
      original,
      other,
      {
        id: 'group0000001',
        name: 'Production copy',
        enabled: false,
        patterns: [
          { ...wildcard, id: 'pattern00001' },
          { ...regex, id: 'pattern00002' },
        ],
        excludes: [{ ...exclude, id: 'pattern00003' }],
        marks: [
          { ...page, id: 'mark00000001' },
          { ...element, id: 'mark00000002' },
        ],
      },
    ]);
  });

  it.each([
    ['a short name', 'Production', 'Production copy'],
    ['35 characters', 'x'.repeat(35), `${'x'.repeat(35)} copy`],
    ['40 characters', 'x'.repeat(40), `${'x'.repeat(35)} copy`],
    ['a cut that ends in a space', `${'a'.repeat(34)} bcd`, `${'a'.repeat(34)} copy`],
    ['a cut through an emoji', `${'a'.repeat(34)}\u{1f600}z`, `${'a'.repeat(34)} copy`],
  ])('adds " copy" within 40 characters: %s', (_case, name, copyName) => {
    const original = aSiteGroup({ name });
    const next = applied(duplicate(stateWith(original), original.id));
    expect(next.siteGroups.map((group) => group.name)).toEqual([name, copyName]);
  });

  it('gives each copy fresh IDs, so duplicating twice keeps every ID unique', () => {
    const original = aSiteGroup({ marks: [aPageMark()] });
    const idGen = fixedIdGen();
    const once = applied(duplicate(stateWith(original), original.id, idGen));
    const twice = applied(duplicate(once, original.id, idGen));
    expect(twice.siteGroups.map((group) => group.id)).toEqual([
      original.id,
      'group0000001',
      'group0000002',
    ]);
  });

  it('refuses when there are already 200 site groups', () => {
    const groups = times(200, () => aSiteGroup());
    const id = groups[0]?.id ?? MISSING_GROUP_ID;
    expect(duplicate(stateWith(...groups), id)).toEqual(err('siteGroupLimitReached'));
  });

  it('reports a site group that no longer exists', () => {
    const state = stateWith(aSiteGroup());
    expect(duplicate(state, MISSING_GROUP_ID)).toEqual(err('siteGroupNotFound'));
  });
});
