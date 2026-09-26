import { describe, expect, it } from 'vitest';
import type { PatternId, SiteGroupId } from '../ids';
import type { SiteMarkState } from '../model/schema';
import { err, ok } from '../result';
import { aRegexPattern, aSiteGroup, aWildcardPattern } from '../testing/builders';
import { applied, MISSING_GROUP_ID, stateWith } from '../testing/reducers';
import { times } from '../testing/schema-results';
import { fixedIdGen } from '../testing/test-doubles';
import type { UrlPatternDraft } from '../url/match';
import { addPattern, removePattern, updatePattern } from './patterns';

const MISSING_PATTERN_ID = 'pat-missing0' as PatternId;
const wildcard = (value: string): UrlPatternDraft => ({ kind: 'wildcard', value });

const add = (state: SiteMarkState, groupId: SiteGroupId, draft: UrlPatternDraft) =>
  addPattern(state, { type: 'addPattern', groupId, draft }, { idGen: fixedIdGen() });
const update = (
  state: SiteMarkState,
  groupId: SiteGroupId,
  patternId: PatternId,
  draft: UrlPatternDraft,
) => updatePattern(state, { type: 'updatePattern', groupId, patternId, draft });
const remove = (state: SiteMarkState, groupId: SiteGroupId, patternId: PatternId) =>
  removePattern(state, { type: 'removePattern', groupId, patternId });

/** The outcome of removePattern, with its state checked against the schema. */
function removed(result: ReturnType<typeof removePattern>) {
  if (!result.ok) return expect.fail(`expected ok, got ${result.error}`);
  applied(ok(result.value.state));
  return result.value;
}

describe('REQ-GRP-002 REQ-URL-003 add a URL pattern to a site group', () => {
  it('stores the canonical form with a new ID at the end of the list', () => {
    const existing = aWildcardPattern();
    const [group, other] = [aSiteGroup({ patterns: [existing] }), aSiteGroup()];
    const next = applied(add(stateWith(group, other), group.id, wildcard(' Example.com ')));
    const added = { id: 'pattern00001', kind: 'wildcard', value: '*://example.com/*' };
    expect(next.siteGroups).toEqual([{ ...group, patterns: [existing, added] }, other]);
  });

  it('stores a regex pattern with canonical, deduplicated origins', () => {
    const group = aSiteGroup({ patterns: [] });
    const origins = ['https://example.com', 'https://example.com/*'];
    const draft = { kind: 'regex', value: '^https://example\\.com/admin/', origins } as const;
    const next = applied(add(stateWith(group), group.id, draft));
    expect(next.siteGroups[0]?.patterns).toEqual([
      { ...draft, id: 'pattern00001', origins: ['https://example.com/*'] },
    ]);
  });

  it.each([
    ['', 'patternEmpty'],
    ['https://ex*ample.com/', 'patternWildcardInHost'],
    ['ftp://example.com/', 'patternInvalidScheme'],
  ])('never stores the invalid pattern %j (%s)', (value, code) => {
    const group = aSiteGroup();
    expect(add(stateWith(group), group.id, wildcard(value))).toEqual(err(code));
  });

  it.each([
    [{ kind: 'regex', value: '(a+)+', origins: ['https://example.com/*'] }, 'regexUnsafe'],
    [{ kind: 'regex', value: '^https://', origins: [] }, 'regexNeedsOrigin'],
    [{ kind: 'regex', value: '^https://', origins: ['*://*.com/*'] }, 'patternTooBroad'],
  ] as const)('never stores the invalid regex %j (%s)', (draft, code) => {
    const group = aSiteGroup();
    expect(add(stateWith(group), group.id, draft)).toEqual(err(code));
  });

  it('keeps the enabled state: adding a pattern does not enable a site group', () => {
    const group = aSiteGroup({ enabled: false, patterns: [] });
    const next = applied(add(stateWith(group), group.id, wildcard('example.com')));
    expect(next.siteGroups[0]?.enabled).toBe(false);
  });

  it('adds the 50th pattern but refuses the 51st', () => {
    const almost = aSiteGroup({ patterns: times(49, () => aWildcardPattern()) });
    const full = applied(add(stateWith(almost), almost.id, wildcard('example.com')));
    expect(full.siteGroups[0]?.patterns).toHaveLength(50);
    expect(add(full, almost.id, wildcard('example.org'))).toEqual(err('patternLimitReached'));
  });

  it('reports a site group that no longer exists', () => {
    const state = stateWith(aSiteGroup());
    expect(add(state, MISSING_GROUP_ID, wildcard('example.com'))).toEqual(err('siteGroupNotFound'));
  });
});

describe('REQ-URL-009 broad patterns are never stored', () => {
  it.each(['*', '*.com', '*.co.uk', '<all_urls>', '*://*/*'])('refuses %j', (value) => {
    const group = aSiteGroup();
    expect(add(stateWith(group), group.id, wildcard(value))).toEqual(err('patternTooBroad'));
  });
});

describe('REQ-GRP-002 REQ-URL-003 edit a URL pattern', () => {
  it('replaces the pattern in place and keeps its ID', () => {
    const [a, b, c] = [aWildcardPattern(), aWildcardPattern(), aWildcardPattern()];
    const group = aSiteGroup({ patterns: [a, b, c] });
    const next = applied(update(stateWith(group), group.id, b.id, wildcard('Test.example.com')));
    const edited = { id: b.id, kind: 'wildcard', value: '*://test.example.com/*' };
    expect(next.siteGroups).toEqual([{ ...group, patterns: [a, edited, c] }]);
  });

  it('can turn a wildcard into a regex pattern', () => {
    const pattern = aWildcardPattern();
    const group = aSiteGroup({ patterns: [pattern] });
    const regex = aRegexPattern({ id: pattern.id });
    const next = applied(update(stateWith(group), group.id, pattern.id, regex));
    expect(next.siteGroups[0]?.patterns).toEqual([regex]);
  });

  it('never stores an invalid edit', () => {
    const pattern = aWildcardPattern();
    const group = aSiteGroup({ patterns: [pattern] });
    const result = update(stateWith(group), group.id, pattern.id, wildcard('*.co.uk'));
    expect(result).toEqual(err('patternTooBroad'));
  });

  it('reports a pattern or site group that no longer exists (excludes are a separate list)', () => {
    const exclude = aWildcardPattern();
    const group = aSiteGroup({ excludes: [exclude] });
    const state = stateWith(group);
    const draft = wildcard('example.com');
    expect(update(state, group.id, exclude.id, draft)).toEqual(err('patternNotFound'));
    expect(update(state, group.id, MISSING_PATTERN_ID, draft)).toEqual(err('patternNotFound'));
    expect(update(state, MISSING_GROUP_ID, exclude.id, draft)).toEqual(err('siteGroupNotFound'));
  });
});

describe('REQ-GRP-002 remove a URL pattern; removing the last one disables the site group', () => {
  it('removes one of several patterns and keeps the site group enabled', () => {
    const [a, b] = [aWildcardPattern(), aWildcardPattern()];
    const [group, other] = [aSiteGroup({ enabled: true, patterns: [a, b] }), aSiteGroup()];
    const outcome = removed(remove(stateWith(group, other), group.id, a.id));
    expect(outcome.state.siteGroups).toEqual([{ ...group, patterns: [b] }, other]);
    expect(outcome.notices).toEqual([]);
  });

  it('disables an enabled site group when its last pattern goes, with a notice', () => {
    const [pattern, exclude] = [aWildcardPattern(), aWildcardPattern()];
    const group = aSiteGroup({ enabled: true, patterns: [pattern], excludes: [exclude] });
    const outcome = removed(remove(stateWith(group), group.id, pattern.id));
    expect(outcome.state.siteGroups).toEqual([{ ...group, enabled: false, patterns: [] }]);
    expect(outcome.notices).toEqual(['siteGroupAutoDisabled']);
  });

  it('gives no notice when the site group was already disabled', () => {
    const pattern = aWildcardPattern();
    const group = aSiteGroup({ enabled: false, patterns: [pattern] });
    const outcome = removed(remove(stateWith(group), group.id, pattern.id));
    expect(outcome.state.siteGroups).toEqual([{ ...group, patterns: [] }]);
    expect(outcome.notices).toEqual([]);
  });

  it('reports a pattern or site group that no longer exists', () => {
    const exclude = aWildcardPattern();
    const group = aSiteGroup({ excludes: [exclude] });
    const state = stateWith(group);
    expect(remove(state, group.id, exclude.id)).toEqual(err('patternNotFound'));
    expect(remove(state, MISSING_GROUP_ID, exclude.id)).toEqual(err('siteGroupNotFound'));
  });
});
