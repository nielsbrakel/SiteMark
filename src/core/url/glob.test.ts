import { describe, expect, it } from 'vitest';
import { matchGlob } from './glob';
import { parseWildcard } from './parse';
import { parseUrl } from './url-parts';
import { matchWildcard } from './wildcard-match';

describe('REQ-URL-001 REQ-URL-010 linear glob matcher', () => {
  it.each([
    ['/admin/*', '/admin/users', true],
    ['/admin/*', '/admin/', true],
    ['/admin/*', '/administrator', false],
    ['/*', '/', true],
    ['*', '', true],
    ['/admin', '/admin', true],
    ['/admin', '/admin/', false],
    ['/a*/b', '/a/x/y/b', true],
    ['a*b*c', 'abc', true],
    ['a*b*c', 'axxbyyc', true],
    ['a*b*c', 'acb', false],
    ['*a', 'ba', true],
    ['a*a', 'a', false],
    ['a*a', 'aa', true],
    ['/x*x*x', '/xx', false],
    ['/x*x*x', '/xxx', true],
    ['**', 'anything', true],
    ['/Path', '/path', false],
    ['/a?x=*', '/a?x=1', true],
    ['/a.b', '/axb', false],
    ['/(a)+[b]', '/(a)+[b]', true],
  ])('%j vs %j → %s', (pattern, text, expected) => {
    expect(matchGlob(pattern, text)).toBe(expected);
  });
});

describe('REQ-URL-010 pattern limits: 500 characters and 10 wildcards', () => {
  const tenStars = `https://*.example.com/${'*/'.repeat(9)}`;

  it('accepts 10 wildcards and rejects 11', () => {
    expect(parseWildcard(tenStars).ok).toBe(true);
    expect(parseWildcard(`${tenStars}*`)).toEqual({ ok: false, error: 'patternTooManyWildcards' });
  });

  it('accepts 500 characters and rejects 501', () => {
    const base = 'https://example.com/';
    const exact = base + 'a'.repeat(500 - base.length);
    expect(parseWildcard(exact).ok).toBe(true);
    expect(parseWildcard(`${exact}a`)).toEqual({ ok: false, error: 'patternTooLong' });
  });

  it('also limits the stored (normalized) form', () => {
    const long = `https://example.com/${'ü'.repeat(100)}`;
    expect(parseWildcard(long)).toEqual({ ok: false, error: 'patternTooLong' });
  });

  it('matches a 10-star pattern against an 8 KB URL in under 5 ms', () => {
    const parsed = parseWildcard('https://example.com/*a*b*a*b*a*b*a*b*a*c');
    const url = parseUrl(`https://example.com/${'ab'.repeat(4096)}`);
    expect(parsed.ok && url).toBeTruthy();
    if (!parsed.ok || !url) return;
    const runs = 50;
    const started = Date.now();
    for (let i = 0; i < runs; i++) expect(matchWildcard(parsed.value, url)).toBe(false);
    expect((Date.now() - started) / runs).toBeLessThan(5);
  });

  it('keeps a star bomb linear', () => {
    const text = 'a'.repeat(8192);
    const started = Date.now();
    expect(matchGlob(`${'*a'.repeat(9)}*b`, text)).toBe(false);
    expect(matchGlob(`*${'a'.repeat(400)}b*`, text)).toBe(false);
    expect(Date.now() - started).toBeLessThan(10); // two matches, < 5 ms each
  });
});
