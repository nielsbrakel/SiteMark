import { describe, expect, it } from 'vitest';
import type { SiteGroup } from '../model/schema';
import type { Result } from '../result';
import { anElementMark, aRegexPattern, aSiteGroup, aState } from '../testing/builders';
import { times } from '../testing/schema-results';
import { buildExport } from './export';
import { type ImportData, type ImportError, parseImport } from './import';
import type { MigrationSteps } from './migrate';

/** 1 MB: the largest import file, in UTF-8 bytes. */
const LIMIT = 1024 * 1024;

function envelope(siteGroups: SiteGroup[] = [aSiteGroup()]): Record<string, unknown> {
  const state = aState({ siteGroups, settings: { theme: 'dark' } });
  return { ...buildExport(state, { appVersion: '1.0.0', now: 0 }).envelope };
}

const fileWith = (changes: Record<string, unknown>): string =>
  JSON.stringify({ ...envelope(), ...changes });

function errorOf(result: Result<ImportData, ImportError>): ImportError {
  if (result.ok) expect.fail(`expected an error, got ${JSON.stringify(result.value)}`);
  return result.error;
}

function schemaPaths(result: Result<ImportData, ImportError>): string[] {
  const error = errorOf(result);
  if (error.code !== 'importSchemaInvalid')
    expect.fail(`expected schema issues, got ${error.code}`);
  return error.issues.map((issue) => issue.path);
}

describe('REQ-DATA-004 parseImport reads an export file', () => {
  it('returns the site groups and settings of a file written by buildExport', () => {
    const groups = [aSiteGroup(), aSiteGroup({ name: 'Admin', patterns: [aRegexPattern()] })];
    const { json } = buildExport(aState({ siteGroups: groups, settings: { theme: 'light' } }), {
      appVersion: '1.2.3',
      now: 0,
    });
    expect(parseImport(json)).toEqual({
      ok: true,
      value: { siteGroups: groups, settings: { theme: 'light' } },
    });
  });

  it('accepts a file of exactly 1 MB and rejects a larger one', () => {
    const json = JSON.stringify(envelope());
    const largest = json + ' '.repeat(LIMIT - json.length);
    expect(parseImport(largest).ok).toBe(true);
    expect(parseImport(`${largest} `)).toEqual({ ok: false, error: { code: 'importTooLarge' } });
  });

  it.each([
    ['2-byte characters', 'é'.repeat(LIMIT / 2 + 1)],
    ['4-byte characters', '😀'.repeat(LIMIT / 4 + 1)],
    ['3-byte characters', '€'.repeat(LIMIT / 3 + 1)],
  ])('measures the size in UTF-8 bytes (%s)', (_name, text) => {
    expect(parseImport(text)).toEqual({ ok: false, error: { code: 'importTooLarge' } });
  });

  it('lets through text under 1 MB with multi-byte characters', () => {
    expect(errorOf(parseImport('é'.repeat(LIMIT / 2)))).toEqual({ code: 'importInvalidJson' });
  });

  it.each(['', '{', 'nope', "{'format': 1}", '{"a":1,}'])('rejects %j as invalid JSON', (text) => {
    expect(errorOf(parseImport(text))).toEqual({ code: 'importInvalidJson' });
  });

  it.each([['[]'], ['null'], ['42'], ['"sitemark-export"']])(
    'rejects %s as not an export',
    (text) => {
      expect(schemaPaths(parseImport(text))).toEqual(['']);
    },
  );

  it.each([
    ['a missing format', { format: undefined }],
    ['another format', { format: 'other-export' }],
  ])('rejects %s before looking at the version', (_name, change) => {
    expect(schemaPaths(parseImport(fileWith({ ...change, schemaVersion: 99 })))).toEqual([
      'format',
    ]);
  });

  it('refuses a newer schema version without reading the rest', () => {
    const newer = fileWith({ schemaVersion: 2, siteGroups: 'anything' });
    expect(errorOf(parseImport(newer))).toEqual({
      code: 'importUnsupportedVersion',
      schemaVersion: 2,
    });
  });

  it.each([['1'], [1.5], [null], [undefined]])('rejects the schema version %j', (version) => {
    expect(schemaPaths(parseImport(fileWith({ schemaVersion: version })))).toEqual([
      'schemaVersion',
    ]);
  });
});

describe('REQ-DATA-004 parseImport migrates older files', () => {
  const group = aSiteGroup();
  const v0File = JSON.stringify({
    format: 'sitemark-export',
    schemaVersion: 0,
    appVersion: '0.9.0',
    exportedAt: '2026-01-01T00:00:00.000Z',
    groups: [group],
  });
  /** A pretend pre-release format: `groups` instead of `siteGroups`, no settings. */
  const v0ToV1 = (data: unknown): unknown => {
    const { groups, ...rest } = data as { groups: unknown };
    return { ...rest, schemaVersion: 1, siteGroups: groups, settings: { theme: 'light' } };
  };

  it('runs the migration steps on the file as a state (REQ-DATA-002 pipeline)', () => {
    const steps: MigrationSteps = { 0: v0ToV1 };
    expect(parseImport(v0File, steps)).toEqual({
      ok: true,
      value: { siteGroups: [group], settings: { theme: 'light' } },
    });
  });

  it('reports a migrated file that is still invalid with readable paths', () => {
    const steps: MigrationSteps = { 0: (data) => ({ ...(v0ToV1(data) as object), extra: 1 }) };
    expect(schemaPaths(parseImport(v0File, steps))).toEqual(['']);
  });

  it('has no step for versions older than 1 yet', () => {
    expect(schemaPaths(parseImport(v0File))).toEqual(['schemaVersion']);
  });
});

describe('REQ-DATA-004 REQ-SEC-004 parseImport validates strictly, with readable paths', () => {
  it('names each invalid field', () => {
    const outline = { widthPx: 99, style: 'solid' as const, pulse: false };
    const groups = [
      { ...aSiteGroup(), name: '' },
      aSiteGroup({ marks: [anElementMark({ effects: { outline } })] }),
    ];
    expect(schemaPaths(parseImport(fileWith({ siteGroups: groups })))).toEqual([
      'siteGroups[0].name',
      'siteGroups[1].marks[0].effects.outline.widthPx',
    ]);
  });

  it.each([
    ['201 site groups', () => times(201, () => aSiteGroup()), 'siteGroups'],
    [
      '51 marks',
      () => [aSiteGroup({ marks: times(51, () => anElementMark()) })],
      'siteGroups[0].marks',
    ],
    [
      'a 501-character selector',
      () => [
        aSiteGroup({
          marks: [anElementMark({ target: { kind: 'element', selector: `#${'a'.repeat(500)}` } })],
        }),
      ],
      'siteGroups[0].marks[0].target.selector',
    ],
    [
      'a 501-character regex',
      () => [aSiteGroup({ patterns: [aRegexPattern({ value: 'a'.repeat(501) })] })],
      'siteGroups[0].patterns[0].value',
    ],
  ])('enforces the limits: %s', (_name, groups, path) => {
    expect(schemaPaths(parseImport(fileWith({ siteGroups: groups() })))).toEqual([path]);
  });

  it.each([
    ['an unknown key in the file', { extra: 1 }, ''],
    ['a revision', { revision: 3 }, ''],
    ['unknown settings', { settings: { theme: 'dark', sync: true } }, 'settings'],
    ['an invalid time', { exportedAt: 'yesterday' }, 'exportedAt'],
  ])('rejects %s', (_name, change, path) => {
    expect(schemaPaths(parseImport(fileWith(change)))).toEqual([path]);
  });

  it('rejects duplicate IDs', () => {
    const group = aSiteGroup();
    const text = fileWith({ siteGroups: [group, { ...group, name: 'Copy' }] });
    expect(schemaPaths(parseImport(text))).toContain('siteGroups[1].id');
  });
});
