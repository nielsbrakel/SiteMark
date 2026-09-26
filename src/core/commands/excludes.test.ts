import { describe, expect, it } from 'vitest';
import type { PatternId, SiteGroupId } from '../ids';
import type { SiteMarkState } from '../model/schema';
import { err } from '../result';
import { aSiteGroup, aWildcardPattern } from '../testing/builders';
import { applied, MISSING_GROUP_ID, stateWith } from '../testing/reducers';
import { times } from '../testing/schema-results';
import { fixedIdGen } from '../testing/test-doubles';
import type { UrlPatternDraft } from '../url/match';
import { addExclude, removeExclude, updateExclude } from './excludes';

const wildcard = (value: string): UrlPatternDraft => ({ kind: 'wildcard', value });

const add = (state: SiteMarkState, groupId: SiteGroupId, draft: UrlPatternDraft) =>
  addExclude(state, { type: 'addExclude', groupId, draft }, { idGen: fixedIdGen() });
const update = (
  state: SiteMarkState,
  groupId: SiteGroupId,
  patternId: PatternId,
  draft: UrlPatternDraft,
) => updateExclude(state, { type: 'updateExclude', groupId, patternId, draft });
const remove = (state: SiteMarkState, groupId: SiteGroupId, patternId: PatternId) =>
  removeExclude(state, { type: 'removeExclude', groupId, patternId });

describe('REQ-URL-008 REQ-GRP-002 add an exclude pattern', () => {
  it('stores the canonical form with a new ID and leaves the URL patterns alone', () => {
    const [pattern, existing] = [aWildcardPattern(), aWildcardPattern()];
    const group = aSiteGroup({ patterns: [pattern], excludes: [existing] });
    const next = applied(add(stateWith(group), group.id, wildcard('Prod.example.com/status')));
    const added = { id: 'pattern00001', kind: 'wildcard', value: '*://prod.example.com/status' };
    expect(next.siteGroups).toEqual([{ ...group, excludes: [existing, added] }]);
  });

  it('never stores an invalid or broad exclude', () => {
    const group = aSiteGroup();
    const state = stateWith(group);
    expect(add(state, group.id, wildcard('https://a*b.com/'))).toEqual(
      err('patternWildcardInHost'),
    );
    expect(add(state, group.id, wildcard('*.com'))).toEqual(err('patternTooBroad'));
  });

  it('adds the 50th exclude but refuses the 51st', () => {
    const almost = aSiteGroup({ excludes: times(49, () => aWildcardPattern()) });
    const full = applied(add(stateWith(almost), almost.id, wildcard('example.com')));
    expect(full.siteGroups[0]?.excludes).toHaveLength(50);
    expect(add(full, almost.id, wildcard('example.org'))).toEqual(err('excludeLimitReached'));
  });

  it('reports a site group that no longer exists', () => {
    const state = stateWith(aSiteGroup());
    expect(add(state, MISSING_GROUP_ID, wildcard('example.com'))).toEqual(err('siteGroupNotFound'));
  });
});

describe('REQ-URL-008 edit an exclude pattern', () => {
  it('replaces the exclude in place and keeps its ID', () => {
    const [a, b] = [aWildcardPattern(), aWildcardPattern()];
    const group = aSiteGroup({ excludes: [a, b] });
    const next = applied(update(stateWith(group), group.id, a.id, wildcard('example.com/health')));
    const edited = { id: a.id, kind: 'wildcard', value: '*://example.com/health' };
    expect(next.siteGroups).toEqual([{ ...group, excludes: [edited, b] }]);
  });

  it('never stores an invalid edit', () => {
    const exclude = aWildcardPattern();
    const group = aSiteGroup({ excludes: [exclude] });
    expect(update(stateWith(group), group.id, exclude.id, wildcard(''))).toEqual(
      err('patternEmpty'),
    );
  });

  it('reports an exclude that no longer exists (URL patterns are a separate list)', () => {
    const pattern = aWildcardPattern();
    const group = aSiteGroup({ patterns: [pattern] });
    expect(update(stateWith(group), group.id, pattern.id, wildcard('example.com'))).toEqual(
      err('patternNotFound'),
    );
  });
});

describe('REQ-URL-008 remove an exclude pattern', () => {
  it('removes the last exclude and keeps the site group enabled', () => {
    const exclude = aWildcardPattern();
    const group = aSiteGroup({ enabled: true, excludes: [exclude] });
    const next = applied(remove(stateWith(group), group.id, exclude.id));
    expect(next.siteGroups).toEqual([{ ...group, excludes: [] }]);
  });

  it('reports an exclude or site group that no longer exists', () => {
    const pattern = aWildcardPattern();
    const group = aSiteGroup({ patterns: [pattern] });
    const state = stateWith(group);
    expect(remove(state, group.id, pattern.id)).toEqual(err('patternNotFound'));
    expect(remove(state, MISSING_GROUP_ID, pattern.id)).toEqual(err('siteGroupNotFound'));
  });
});
