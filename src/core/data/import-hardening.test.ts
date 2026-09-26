import { describe, expect, it } from 'vitest';
import type { SiteGroup, UrlPattern } from '../model/schema';
import type { Result } from '../result';
import { aRegexPattern, aSiteGroup, aState, aWildcardPattern } from '../testing/builders';
import type { OriginPattern } from '../url/origin';
import { buildExport } from './export';
import { type ImportData, type ImportError, type PatternIssue, parseImport } from './import';

/** A compact export file (no indent), so tests can splice raw JSON into it. */
function fileOf(siteGroups: SiteGroup[] = [aSiteGroup()]): string {
  const state = aState({ siteGroups, settings: { theme: 'dark' } });
  return JSON.stringify(buildExport(state, { appVersion: '1.0.0', now: 0 }).envelope);
}

function importedOf(result: Result<ImportData, ImportError>): ImportData {
  if (!result.ok) expect.fail(`expected ok, got ${JSON.stringify(result.error)}`);
  return result.value;
}

function errorOf(result: Result<ImportData, ImportError>): ImportError {
  if (result.ok) expect.fail(`expected an error, got ${JSON.stringify(result.value)}`);
  return result.error;
}

function patternIssues(result: Result<ImportData, ImportError>): readonly PatternIssue[] {
  const error = errorOf(result);
  if (error.code !== 'importPatternInvalid') expect.fail(`expected pattern issues: ${error.code}`);
  return error.issues;
}

const origins = (...values: string[]) => values as OriginPattern[];

describe('REQ-SEC-004 parseImport catches excessive nesting before parsing', () => {
  const nested = (depth: number) => `${'['.repeat(depth)}${']'.repeat(depth)}`;

  it('rejects more than 32 levels of arrays or objects', () => {
    expect(errorOf(parseImport(nested(33)))).toEqual({ code: 'importTooDeep' });
    expect(errorOf(parseImport(`{"a":${'{"a":'.repeat(32)}1${'}'.repeat(33)}`))).toEqual({
      code: 'importTooDeep',
    });
    expect(errorOf(parseImport(nested(32))).code).toBe('importSchemaInvalid');
  });

  it('never throws on extreme nesting, even when the JSON is unbalanced', () => {
    expect(errorOf(parseImport('['.repeat(500_000)))).toEqual({ code: 'importTooDeep' });
    expect(errorOf(parseImport(']'.repeat(40) + nested(10))).code).toBe('importInvalidJson');
  });

  it.each([
    ['brackets', '[{'.repeat(20)],
    ['an escaped quote', `"${'['.repeat(39)}`],
    ['escaped backslashes', '[\\'.repeat(20)],
  ])('ignores %s inside strings', (_name, name) => {
    const text = fileOf([aSiteGroup({ name })]);
    expect(importedOf(parseImport(text)).siteGroups[0]?.name).toBe(name);
  });
});

describe('REQ-SEC-004 parseImport cannot pollute object prototypes', () => {
  const payload = '"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}},';

  it.each([
    ['the file', (text: string) => text.replace('{', `{${payload}`), ''],
    ['a site group', (text: string) => text.replace('[{', `[{${payload}`), 'siteGroups[0]'],
    [
      'the settings',
      (text: string) => text.replace('"settings":{', `"settings":{${payload}`),
      'settings',
    ],
  ])('rejects __proto__ and constructor keys in %s', (_name, splice, path) => {
    const error = errorOf(parseImport(splice(fileOf())));
    expect(error).toMatchObject({ code: 'importSchemaInvalid', issues: [{ path }] });
    expect(JSON.stringify(error)).toContain('__proto__');
    expect(JSON.stringify(error)).toContain('constructor');
    expect(({} as { polluted?: unknown }).polluted).toBeUndefined();
    expect(Object.hasOwn(Object.prototype, 'polluted')).toBe(false);
  });

  it('returns plain objects', () => {
    const { siteGroups, settings } = importedOf(parseImport(fileOf()));
    expect(Object.getPrototypeOf(settings)).toBe(Object.prototype);
    expect(Object.getPrototypeOf(siteGroups[0])).toBe(Object.prototype);
  });
});

describe('REQ-URL-009 parseImport re-validates every pattern with the URL engine', () => {
  const withPattern = (pattern: UrlPattern) => fileOf([aSiteGroup({ patterns: [pattern] })]);

  it.each(['*://*/*', 'https://*.com/*', '*.co.uk', '<all_urls>'])(
    'rejects the broad pattern %s',
    (value) => {
      expect(patternIssues(parseImport(withPattern(aWildcardPattern({ value }))))).toEqual([
        { path: 'siteGroups[0].patterns[0]', code: 'patternTooBroad' },
      ]);
    },
  );

  it('rejects an unsafe regex', () => {
    const unsafe = aRegexPattern({ value: '(a+)+$' });
    const text = fileOf([aSiteGroup(), aSiteGroup({ patterns: [unsafe] })]);
    expect(patternIssues(parseImport(text))).toEqual([
      { path: 'siteGroups[1].patterns[0]', code: 'regexUnsafe' },
    ]);
  });

  it('rejects a regex origin that is broad or not canonical at the schema level', () => {
    const broad = aRegexPattern({ origins: origins('https://*.com/*') });
    const ported = aRegexPattern({ origins: origins('https://example.com:8443/*') });
    const result = parseImport(fileOf([aSiteGroup({ patterns: [broad, ported] })]));
    expect(result.ok ? [] : 'issues' in result.error ? result.error.issues : []).toEqual([
      expect.objectContaining({ path: 'siteGroups[0].patterns[0].origins[0]' }),
      expect.objectContaining({ path: 'siteGroups[0].patterns[1].origins[0]' }),
    ]);
  });

  it('checks excludes too', () => {
    const text = fileOf([aSiteGroup({ excludes: [aWildcardPattern({ value: '*://*/*' })] })]);
    expect(patternIssues(parseImport(text))).toEqual([
      { path: 'siteGroups[0].excludes[0]', code: 'patternTooBroad' },
    ]);
  });

  it('stores patterns in canonical form', () => {
    const wildcard = aWildcardPattern({ value: 'Prod.Example.com' });
    const regex = aRegexPattern({ origins: origins('https://example.com/*') });
    const [group] = importedOf(
      parseImport(fileOf([aSiteGroup({ patterns: [wildcard, regex] })])),
    ).siteGroups;
    expect(group?.patterns).toEqual([
      { ...wildcard, value: '*://prod.example.com/*' },
      { ...regex, origins: ['https://example.com/*'] },
    ]);
  });
});
