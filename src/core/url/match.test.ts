import { describe, expect, it } from 'vitest';
import type { RegexErrorCode, UrlPatternErrorCode } from '../errors';
import { matchUrlPattern, normalizeUrlPattern, type UrlPatternValue } from './match';
import { type OriginPattern, validateRegexOrigins } from './origin';
import { parseUrl } from './url-parts';

const origin = (value: string) => value as OriginPattern;

function regex(value: string, origins = ['https://example.com/*']): UrlPatternValue {
  return { kind: 'regex', value, origins: origins.map(origin) };
}

describe('REQ-URL-004 regex matching with an origin prefilter', () => {
  it('tests the full URL without its fragment', () => {
    const pattern = regex(String.raw`^https://example\.com/admin/\d+$`);
    expect(matchUrlPattern(pattern, 'https://example.com/admin/42#top')).toBe(true);
    expect(matchUrlPattern(pattern, 'https://example.com/admin/42?x=1')).toBe(false);
    expect(matchUrlPattern(regex('tab=1'), 'https://example.com/?tab=1')).toBe(true);
    expect(matchUrlPattern(regex('top'), 'https://example.com/#top')).toBe(false);
  });

  it('only runs after one of its origins matches', () => {
    expect(matchUrlPattern(regex('example', ['https://other.com/*']), 'https://example.com/')).toBe(
      false,
    );
    const two = regex('example', ['https://a.test/*', '*://*.example.com/*']);
    expect(matchUrlPattern(two, 'http://x.example.com/')).toBe(true);
    expect(matchUrlPattern(regex('example', []), 'https://example.com/')).toBe(false);
  });

  it('only runs on URLs of at most 2048 characters (fragment excluded)', () => {
    const base = 'https://example.com/';
    const longest = base + 'a'.repeat(2048 - base.length);
    expect(matchUrlPattern(regex('a$'), longest)).toBe(true);
    expect(matchUrlPattern(regex('a$'), `${longest}#${'f'.repeat(100)}`)).toBe(true);
    expect(matchUrlPattern(regex('a$'), `${longest}a`)).toBe(false);
  });

  it('uses fixed flags: case-sensitive, unicode', () => {
    expect(matchUrlPattern(regex('EXAMPLE'), 'https://example.com/')).toBe(false);
    expect(matchUrlPattern(regex(String.raw`/\u{61}$`), 'https://example.com/a')).toBe(true);
  });

  it('never matches with an invalid or unsafe stored regex', () => {
    expect(matchUrlPattern(regex('('), 'https://example.com/')).toBe(false);
    expect(matchUrlPattern(regex('(a+)+$'), 'https://example.com/aaaa')).toBe(false);
  });

  it('accepts a URL that is already split into parts', () => {
    const parts = parseUrl('https://example.com/admin');
    expect(parts && matchUrlPattern(regex('admin$'), parts)).toBe(true);
  });
});

describe('REQ-URL-001 matchUrlPattern with wildcard patterns', () => {
  it.each([
    ['*.example.com', 'https://a.example.com/', true],
    ['https://example.com/admin', 'https://example.com/admin?tab=1#x', true],
    ['https://example.com/admin', 'https://example.com/other', false],
    ['https://ex*ple.com/', 'https://example.com/', false],
    ['*', 'https://example.com/', false],
  ])('%j vs %j → %s', (value, url, expected) => {
    expect(matchUrlPattern({ kind: 'wildcard', value }, url)).toBe(expected);
  });
});

describe('REQ-URL-004 validating a pattern for storage', () => {
  it('normalizes a wildcard pattern', () => {
    expect(normalizeUrlPattern({ kind: 'wildcard', value: 'Example.com' })).toEqual({
      ok: true,
      value: { kind: 'wildcard', value: '*://example.com/*' },
    });
    expect(normalizeUrlPattern({ kind: 'wildcard', value: '*.co.uk' })).toEqual({
      ok: false,
      error: 'patternTooBroad',
    });
  });

  it('keeps a safe regex and canonicalizes its origins', () => {
    const draft = {
      kind: 'regex' as const,
      value: '^https://',
      origins: ['https://example.com', 'https://example.com/*', 'http://localhost:3000'],
    };
    expect(normalizeUrlPattern(draft)).toEqual({
      ok: true,
      value: {
        kind: 'regex',
        value: '^https://',
        origins: ['https://example.com/*', 'http://localhost/*'],
      },
    });
  });

  const hosts = Array.from({ length: 21 }, (_, i) => `https://site${i}.example/*`);
  const rejected: [string, string[], RegexErrorCode | UrlPatternErrorCode][] = [
    ['(a+)+', ['https://example.com/*'], 'regexUnsafe'],
    ['(', ['https://example.com/*'], 'regexInvalid'],
    ['^https://', [], 'regexNeedsOrigin'],
    ['^https://', hosts, 'regexTooManyOrigins'],
    ['^https://', ['*://*/*'], 'patternTooBroad'],
    ['^https://', ['ftp://example.com/*'], 'patternInvalidScheme'],
  ];

  it.each(rejected)('rejects %j with origins %j → %s', (value, origins, code) => {
    expect(normalizeUrlPattern({ kind: 'regex', value, origins })).toEqual({
      ok: false,
      error: code,
    });
  });

  it('allows 1 to 20 origins', () => {
    expect(validateRegexOrigins(hosts.slice(0, 20))).toMatchObject({ ok: true });
    expect(validateRegexOrigins(hosts.slice(0, 1))).toEqual({
      ok: true,
      value: ['https://site0.example/*'],
    });
    expect(validateRegexOrigins(hosts)).toEqual({ ok: false, error: 'regexTooManyOrigins' });
  });
});
