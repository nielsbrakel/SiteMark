import { describe, expect, it } from 'vitest';
import type { SiteGroupId } from '../ids';
import type { SiteGroup, SiteMarkState } from '../model/schema';
import { err } from '../result';
import { aPageMark, aRegexPattern, aSiteGroup, aWildcardPattern } from '../testing/builders';
import { applied, frozen, stateWith } from '../testing/reducers';
import { times } from '../testing/schema-results';
import { fixedIdGen } from '../testing/test-doubles';
import type { OriginPattern } from '../url/origin';
import type { ImportData } from './import';
import { mergeImport, previewImport, replaceImport } from './merge-import';

/** A frozen, parsed import file with these site groups and the dark theme. */
const file = (...siteGroups: SiteGroup[]): ImportData =>
  frozen({ siteGroups, settings: { theme: 'dark' } });

const onHost = (host: string, overrides: Partial<SiteGroup> = {}): SiteGroup =>
  aSiteGroup({ patterns: [aWildcardPattern({ value: `https://${host}/*` })], ...overrides });

const merge = (local: SiteMarkState, incoming: ImportData) =>
  mergeImport(local, incoming, { idGen: fixedIdGen() });

describe('REQ-DATA-004 import preview: N updated, M new, K new origins', () => {
  const a = onHost('a.test');
  const local = stateWith(a, onHost('b.test'));
  const regex = aRegexPattern({ origins: ['https://d.test/*' as OriginPattern] });
  const regexExclude = aRegexPattern();
  const updatedA = { ...a, patterns: [...a.patterns, aWildcardPattern({ value: 'c.test' })] };
  const withRegex = aSiteGroup({
    patterns: [regex],
    excludes: [regexExclude],
  });
  const incoming = file(updatedA, withRegex, onHost('b.test'));

  it('counts the site groups it updates (same ID) and adds', () => {
    expect(previewImport(local, incoming)).toMatchObject({ updated: 1, added: 2 });
  });

  it('lists the origins the imported groups need that the local state did not', () => {
    expect(previewImport(local, incoming).newOrigins).toEqual(['*://c.test/*', 'https://d.test/*']);
  });

  it('lists the regex patterns and excludes in the file, to highlight them', () => {
    expect(previewImport(local, incoming).regexPatterns).toEqual([
      { siteGroupId: withRegex.id, list: 'patterns', pattern: regex },
      { siteGroupId: withRegex.id, list: 'excludes', pattern: regexExclude },
    ]);
  });

  it('shows nothing new for a file with the local site groups', () => {
    expect(previewImport(local, file(...local.siteGroups))).toEqual({
      updated: 2,
      added: 0,
      newOrigins: [],
      regexPatterns: [],
    });
  });
});

describe('REQ-DATA-004 Merge upserts site groups by ID and keeps the local settings (D-218)', () => {
  it('replaces a same-ID group in place and appends new ones at the bottom in file order', () => {
    const [a, b, c] = [onHost('a.test'), onHost('b.test'), onHost('c.test')];
    const newA = { ...a, name: 'Renamed', marks: [aPageMark()] };
    const [x, y] = [onHost('x.test'), onHost('y.test')];
    const merged = applied(merge(stateWith(a, b, c), file(x, newA, y)));
    expect(merged.siteGroups).toEqual([newA, b, c, x, y]);
  });

  it('keeps the local settings and revision', () => {
    const local = stateWith(onHost('a.test'));
    const merged = applied(merge(local, file(onHost('b.test'))));
    expect(merged.settings).toEqual(local.settings);
    expect(merged.revision).toBe(local.revision);
  });

  it('keeps the IDs of an updated group, even when its items stay the same', () => {
    const a = onHost('a.test', { marks: [aPageMark()] });
    const newA = {
      ...a,
      patterns: [{ ...a.patterns[0], value: 'https://a2.test/*' }],
    } as SiteGroup;
    expect(applied(merge(stateWith(a), file(newA))).siteGroups).toEqual([newA]);
  });

  it('gives fresh IDs to imported items whose IDs another local site group uses', () => {
    const [pattern, second] = [aWildcardPattern(), aWildcardPattern({ value: 'b.test' })];
    const [exclude, mark] = [aWildcardPattern({ value: 'https://b.test/health' }), aPageMark()];
    const other = aSiteGroup({ patterns: [pattern, second], excludes: [exclude], marks: [mark] });
    const kept = aWildcardPattern({ value: 'https://kept.test/*' });
    const clash = aSiteGroup({
      patterns: [{ ...pattern, value: 'https://c.test/*' }, kept],
      excludes: [exclude],
      marks: [mark],
    });
    const groupClash = onHost('d.test', { id: second.id as string as SiteGroupId });
    const merged = applied(merge(stateWith(other), file(clash, groupClash)));
    expect(merged.siteGroups).toEqual([
      other,
      {
        ...clash,
        patterns: [{ ...clash.patterns[0], id: 'pattern00001' }, kept],
        excludes: [{ ...exclude, id: 'pattern00002' }],
        marks: [{ ...mark, id: 'mark00000001' }],
      },
      { ...groupClash, id: 'group0000001' },
    ]);
  });

  it('allows up to 200 site groups and refuses more', () => {
    const local = stateWith(...times(150, () => aSiteGroup()));
    const update = { ...local.siteGroups[0], name: 'Updated' } as SiteGroup;
    const fifty = times(50, () => aSiteGroup());
    expect(applied(merge(local, file(update, ...fifty))).siteGroups).toHaveLength(200);
    expect(merge(local, file(...fifty, aSiteGroup()))).toEqual(err('siteGroupLimitReached'));
  });
});

describe('REQ-DATA-004 Replace takes the whole file', () => {
  it("uses the file's site groups and settings and keeps the revision", () => {
    const local = stateWith(onHost('a.test'), onHost('b.test'));
    const incoming = file(onHost('c.test'));
    expect(replaceImport(local, incoming)).toEqual({
      schemaVersion: 1,
      revision: local.revision,
      siteGroups: incoming.siteGroups,
      settings: { theme: 'dark' },
    });
  });

  it('can empty the state', () => {
    expect(replaceImport(stateWith(onHost('a.test')), file()).siteGroups).toEqual([]);
  });
});
