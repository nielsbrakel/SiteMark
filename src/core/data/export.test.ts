import { describe, expect, it } from 'vitest';
import type { SiteMarkState } from '../model/schema';
import { aRegexPattern, aSiteGroup, aState } from '../testing/builders';
import { messagesOf, okValue, pathsOf, untrusted } from '../testing/schema-results';
import { buildExport, exportFilename } from './export';
import { parseExportEnvelope } from './export-schema';

/** 2026-09-25T14:30:05.123Z */
const NOW = Date.UTC(2026, 8, 25, 14, 30, 5, 123);

function sampleState(): SiteMarkState {
  return aState({
    revision: 17,
    siteGroups: [aSiteGroup(), aSiteGroup({ name: 'Admin', patterns: [aRegexPattern()] })],
    settings: { theme: 'dark' },
  });
}

describe('REQ-DATA-003 export envelope', () => {
  it('contains the format, versions, UTC time, site groups and settings', () => {
    const state = sampleState();
    expect(buildExport(state, { appVersion: '1.2.3', now: NOW }).envelope).toEqual({
      format: 'sitemark-export',
      schemaVersion: 1,
      appVersion: '1.2.3',
      exportedAt: '2026-09-25T14:30:05.123Z',
      siteGroups: state.siteGroups,
      settings: { theme: 'dark' },
    });
  });

  it('keeps the spec order of the keys and leaves out the revision', () => {
    const { envelope } = buildExport(sampleState(), { appVersion: '1.0.0', now: NOW });
    expect(Object.keys(envelope)).toEqual([
      'format',
      'schemaVersion',
      'appVersion',
      'exportedAt',
      'siteGroups',
      'settings',
    ]);
  });

  it('is pretty-printed JSON with a 2-space indent', () => {
    const { envelope, json } = buildExport(sampleState(), { appVersion: '1.0.0', now: NOW });
    expect(json).toBe(`${JSON.stringify(envelope, null, 2)}\n`);
    expect(json.startsWith('{\n  "format": "sitemark-export",\n  "schemaVersion": 1,')).toBe(true);
    expect(JSON.parse(json)).toEqual(envelope);
  });

  it('exports an empty state', () => {
    const state = aState({ siteGroups: [] });
    const { envelope } = buildExport(state, { appVersion: '1.0.0', now: 0 });
    expect(envelope.siteGroups).toEqual([]);
    expect(envelope.exportedAt).toBe('1970-01-01T00:00:00.000Z');
  });

  it('writes a file that the envelope schema reads back unchanged', () => {
    const { envelope, json } = buildExport(sampleState(), { appVersion: '1.0.0', now: NOW });
    expect(okValue(parseExportEnvelope(JSON.parse(json)))).toEqual(envelope);
  });
});

describe('REQ-DATA-003 export file name uses the local date', () => {
  it.each([
    [{ year: 2026, month: 9, day: 25 }, 'sitemark-export-2026-09-25.json'],
    [{ year: 2026, month: 1, day: 5 }, 'sitemark-export-2026-01-05.json'],
    [{ year: 2027, month: 12, day: 31 }, 'sitemark-export-2027-12-31.json'],
  ])('%o → %s', (date, name) => {
    expect(exportFilename(date)).toBe(name);
  });
});

describe('REQ-DATA-003 the export envelope schema is strict', () => {
  const valid = (): Record<string, unknown> =>
    untrusted(buildExport(sampleState(), { appVersion: '1.0.0', now: NOW }).envelope) as Record<
      string,
      unknown
    >;

  it('accepts a 4-part manifest version', () => {
    expect(parseExportEnvelope({ ...valid(), appVersion: '1.0.0.12' }).ok).toBe(true);
  });

  it.each([
    ['an unknown key', { extra: true }],
    ['the revision (not part of an export)', { revision: 3 }],
  ])('rejects %s on the envelope itself, naming the key', (_name, change) => {
    const result = parseExportEnvelope({ ...valid(), ...change });
    expect(pathsOf(result)).toEqual(['']);
    expect(messagesOf(result)[0]).toContain(Object.keys(change)[0]);
  });

  it.each([
    ['another format', { format: 'other-export' }, 'format'],
    ['a newer schemaVersion', { schemaVersion: 2 }, 'schemaVersion'],
    ['an empty appVersion', { appVersion: '' }, 'appVersion'],
    ['a non-numeric appVersion', { appVersion: 'latest' }, 'appVersion'],
    ['a local time', { exportedAt: '2026-09-25T16:30:05+02:00' }, 'exportedAt'],
    ['a date without time', { exportedAt: '2026-09-25' }, 'exportedAt'],
    ['unknown settings', { settings: { theme: 'dark', extra: 1 } }, 'settings'],
    [
      'an invalid site group',
      { siteGroups: [{ ...aSiteGroup(), name: '' }] },
      'siteGroups[0].name',
    ],
  ])('rejects %s', (_name, change, path) => {
    expect(pathsOf(parseExportEnvelope({ ...valid(), ...change }))).toEqual([path]);
  });

  it('rejects duplicate IDs, like the stored state', () => {
    const group = aSiteGroup();
    const envelope = { ...valid(), siteGroups: [group, { ...group, name: 'Copy' }] };
    expect(pathsOf(parseExportEnvelope(untrusted(envelope)))).toContain('siteGroups[1].id');
  });

  it('rejects a missing key', () => {
    const { settings: _, ...withoutSettings } = valid();
    expect(pathsOf(parseExportEnvelope(withoutSettings))).toEqual(['settings']);
  });
});
