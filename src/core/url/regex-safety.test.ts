import { describe, expect, it } from 'vitest';
import type { RegexErrorCode } from '../errors';
import { validateRegex } from './regex-safety';

describe('REQ-URL-004 regex patterns: safe subset only (D-211)', () => {
  it.each([
    String.raw`^https://example\.com/(admin|users)/\d+$`,
    String.raw`^https://[a-z]+\.example\.com/`,
    '/items/[0-9]{1,5}',
    '(foo)?bar+',
    String.raw`^https://example\.com/(?:a|b)?x*$`,
    String.raw`(\d+)?`,
    String.raw`(?<id>\d+)`,
    String.raw`\bstaging\b`,
    String.raw`\p{L}+`,
    String.raw`\u{1F600}`,
    '[^/]+',
    'a{2}b{3,}',
    'a'.repeat(500),
    // Alternation outside a repeat, and repeats that can't eat what follows them.
    String.raw`^https://[a-z0-9-]+\.example\.com/(admin|ops)/.*`,
    String.raw`^https://[^/]+\.example\.com/[^?]*\?(.*&)?debug=1`,
    String.raw`^https?://(staging|stage|stg)[.-]`,
    String.raw`[a-z]+\.example\.com/`,
    String.raw`/admin/\d+$`,
    // Anchored, so it runs once: overlapping repeats cost ~n² there, not ~n³.
    String.raw`^\d*\d*$`,
    // Character sets: a repeat followed by a character it can't match.
    String.raw`\d+\Dxyz`,
    String.raw`\w+\Wxyz`,
    String.raw`\s+\Sxyz`,
    '[^/]+/xyz',
    '[a-z]+[0-9]xyz',
  ])('accepts %j', (source) => {
    expect(validateRegex(source)).toEqual({ ok: true, value: source });
  });

  const rejected: [string, RegexErrorCode][] = [
    // Does not parse (with the flags the code uses: unicode).
    ['', 'regexInvalid'],
    ['(', 'regexInvalid'],
    ['[a-', 'regexInvalid'],
    ['a{2,1}', 'regexInvalid'],
    [String.raw`\p{Nope}`, 'regexInvalid'],
    [String.raw`\c`, 'regexInvalid'],
    ['(?i:a)', 'regexInvalid'],
    // Backreferences.
    [String.raw`(a)\1`, 'regexUnsafe'],
    [String.raw`(?<n>a)\k<n>`, 'regexUnsafe'],
    // Lookaround.
    ['(?=a)', 'regexUnsafe'],
    ['(?!a)b', 'regexUnsafe'],
    ['(?<=a)b', 'regexUnsafe'],
    ['(?<!a)b', 'regexUnsafe'],
    // Nested quantifiers (star height > 1).
    ['(a+)+', 'regexUnsafe'],
    ['(a*)*b', 'regexUnsafe'],
    ['(?:a|b+)*', 'regexUnsafe'],
    ['((ab)*c)+', 'regexUnsafe'],
    ['(a{1,2})+', 'regexUnsafe'],
    ['(a?)+', 'regexUnsafe'],
    ['(x(a+)?)*', 'regexUnsafe'],
    // Alternation inside a repeat (exponential backtracking).
    ['(a|a)*$', 'regexUnsafe'],
    ['(?:a|b)+', 'regexUnsafe'],
    ['(?:ab|cd){2,}', 'regexUnsafe'],
    // Repeats that can eat the same characters, unanchored (polynomial backtracking).
    [String.raw`\d*\d*\d*\d*x`, 'regexUnsafe'],
    [String.raw`\d*\d*$`, 'regexUnsafe'],
    ['.*.*x', 'regexUnsafe'],
    ['.*a.*a.*x', 'regexUnsafe'],
    [String.raw`\d+\d{400}x`, 'regexUnsafe'],
    [String.raw`[a-z0-9-]+\.example\.com/(admin|ops)/.*`, 'regexUnsafe'],
    [String.raw`^\d*\d*\d*$`, 'regexUnsafe'],
    [`${'(?:a|a)'.repeat(20)}x`, 'regexUnsafe'],
    // Character sets: the repeat can also match the character after it.
    [String.raw`\d+\wxyz`, 'regexUnsafe'],
    [String.raw`\w+\dxyz`, 'regexUnsafe'],
    [String.raw`\s+ xyz`, 'regexUnsafe'],
    [String.raw`[^/]+\.xyz`, 'regexUnsafe'],
    [String.raw`[a-z]+[x-z0-9]xyz`, 'regexUnsafe'],
    [String.raw`\p{L}+/xyz`, 'regexUnsafe'],
    // Length.
    ['a'.repeat(501), 'regexTooLong'],
  ];

  it.each(rejected)('rejects %j with %s', (source, code) => {
    expect(validateRegex(source)).toEqual({ ok: false, error: code });
  });
});

/** URLs of 2048 characters that make a backtracking engine work hard. */
const HOSTILE_URLS = ['1', '1x', '11x', 'x', '.', 'a.', 'a/', 'a.c', '1.'].flatMap((unit) => {
  const url = `https://example.com/${unit.repeat(2048)}`.slice(0, 2048);
  return [url, `${url.slice(0, -1)}!`];
});

/** The slowest run of `source` over the hostile URLs, in ms. */
function slowestRun(source: string): number {
  const regex = new RegExp(source, 'u');
  return Math.max(
    ...HOSTILE_URLS.map((url) => {
      const started = Date.now();
      regex.test(url);
      return Date.now() - started;
    }),
  );
}

describe('REQ-URL-004 an accepted regex stays fast on a hostile URL (D-211)', () => {
  // The worst accepted shapes found by fuzzing take ≈ 10 ms on a laptop; rejected ones take seconds.
  it.each([
    String.raw`\w*$`,
    String.raw`\d+/`,
    String.raw`\d*\.\.\.`,
    String.raw`[a-z.]+1.1/(?:1)?11111`,
    String.raw`\d{0,50}1\d?1\d{0,9}\.\.\.`,
    String.raw`^\d*\d*$`,
    String.raw`^https://[^/]+\.example\.com/[^?]*\?(.*&)?debug=1`,
    '(foo)?bar+',
  ])('%j is accepted and runs in < 50 ms', (source) => {
    expect(validateRegex(source).ok).toBe(true);
    expect(slowestRun(source)).toBeLessThan(50);
  });
});
