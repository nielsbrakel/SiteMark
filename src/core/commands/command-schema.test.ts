import { describe, expect, it } from 'vitest';
import type { MarkId, PatternId, SiteGroupId } from '../ids';
import { ok } from '../result';
import { anElementMark, aPageMark } from '../testing/builders';
import { pathsOf, untrusted } from '../testing/schema-results';
import type { Command, CommandOf } from './command';
import { parseCommand } from './command-schema';

const id = 'grp-00000001' as SiteGroupId;
const groupId = id;
const patternId = 'pat-00000001' as PatternId;
const markId = 'mrk-00000001' as MarkId;
const { id: _pageId, ...pageDraft } = aPageMark();
const { id: _elementId, ...elementDraft } = anElementMark({ label: 'Save' });
const wildcard = { kind: 'wildcard', value: 'example.com' } as const;
const regex = { kind: 'regex', value: '^https://', origins: ['https://example.com'] } as const;

// One valid example per command type: a new command is a type error here until it has one, and
// the test below fails until the schema has a branch for it.
const examples: { [T in Command['type']]: CommandOf<T> } = {
  createSiteGroup: { type: 'createSiteGroup', name: 'Staging' },
  renameSiteGroup: { type: 'renameSiteGroup', id, name: 'Live' },
  deleteSiteGroup: { type: 'deleteSiteGroup', id },
  setSiteGroupEnabled: { type: 'setSiteGroupEnabled', id, enabled: true },
  moveSiteGroup: { type: 'moveSiteGroup', id, toIndex: -1 },
  duplicateSiteGroup: { type: 'duplicateSiteGroup', id },
  addPattern: { type: 'addPattern', groupId, draft: wildcard },
  updatePattern: { type: 'updatePattern', groupId, patternId, draft: regex },
  removePattern: { type: 'removePattern', groupId, patternId },
  addExclude: { type: 'addExclude', groupId, draft: regex },
  updateExclude: { type: 'updateExclude', groupId, patternId, draft: wildcard },
  removeExclude: { type: 'removeExclude', groupId, patternId },
  addMark: { type: 'addMark', groupId, mark: pageDraft },
  updateMark: { type: 'updateMark', groupId, markId, mark: elementDraft },
  removeMark: { type: 'removeMark', groupId, markId },
  moveMark: { type: 'moveMark', groupId, markId, toIndex: 3 },
  markThisSite: { type: 'markThisSite', origin: { hostname: 'localhost', port: '3000' } },
  setTheme: { type: 'setTheme', theme: 'light' },
};

describe('REQ-SEC-001 REQ-SEC-004 the command schema checks untrusted commands', () => {
  it.each(Object.entries(examples))('accepts a valid %s command', (_type, command) => {
    expect(parseCommand(untrusted(command))).toEqual(ok(command));
  });

  it.each<[string, unknown]>([
    ['not an object', 'createSiteGroup'],
    ['null', null],
    ['no type', { name: 'Staging' }],
    ['an unknown type', { type: 'replaceState', state: {} }],
    ['an extra key', { ...examples.setTheme, revision: 3 }],
    ['a missing field', { type: 'renameSiteGroup', id }],
    ['a malformed ID', { ...examples.deleteSiteGroup, id: 'short' }],
    ['a fractional index', { ...examples.moveSiteGroup, toIndex: 1.5 }],
    ['a non-boolean', { ...examples.setSiteGroupEnabled, enabled: 'true' }],
    ['an unknown theme', { type: 'setTheme', theme: 'neon' }],
    ['an unknown pattern kind', { ...examples.addPattern, draft: { kind: 'glob', value: 'x' } }],
    ['a regex without origins', { ...examples.addPattern, draft: { kind: 'regex', value: '^' } }],
    [
      'a pattern draft with an ID',
      { ...examples.addPattern, draft: { ...wildcard, id: patternId } },
    ],
    ['a mark draft with an ID', { ...examples.addMark, mark: { ...pageDraft, id: markId } }],
    ['a mark without effects', { ...examples.addMark, mark: { ...pageDraft, effects: {} } }],
    [
      'an origin with extra keys',
      { ...examples.markThisSite, origin: { hostname: 'a.b', port: '', x: 1 } },
    ],
    ['an oversized name', { type: 'createSiteGroup', name: 'x'.repeat(8193) }],
    [
      'too many regex origins',
      { ...examples.addPattern, draft: { ...regex, origins: Array(101).fill('a.b') } },
    ],
  ])('refuses %s', (_case, input) => {
    expect(parseCommand(input)).toMatchObject({ ok: false });
  });

  it('reads a mark draft like the model does: lowercase hex, cleaned label', () => {
    const mark = { ...pageDraft, color: '#C93A2E', label: ' Prod‮ ' };
    expect(parseCommand({ ...examples.addMark, mark })).toEqual(
      ok({ ...examples.addMark, mark: { ...pageDraft, color: '#c93a2e', label: 'Prod' } }),
    );
  });

  it('leaves pattern syntax to the URL engine, which returns a typed error code', () => {
    const draft = { kind: 'wildcard', value: 'https://ex*ample.com/' };
    expect(parseCommand({ ...examples.addPattern, draft })).toMatchObject({ ok: true });
  });

  it('says where the problem is', () => {
    expect(pathsOf(parseCommand({ ...examples.renameSiteGroup, name: 5 }))).toEqual(['name']);
  });
});
