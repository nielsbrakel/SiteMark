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
    // Length.
    ['a'.repeat(501), 'regexTooLong'],
  ];

  it.each(rejected)('rejects %j with %s', (source, code) => {
    expect(validateRegex(source)).toEqual({ ok: false, error: code });
  });
});
