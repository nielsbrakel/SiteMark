import { describe, expect, it } from 'vitest';
import { isPublicSuffix } from './broad';
import { normalizeWildcard, parseWildcard } from './parse';

describe('REQ-URL-009 broad patterns are rejected (D-212)', () => {
  it.each([
    // Spec §5.1 acceptance rows.
    '*',
    '*://*/*',
    '*.com',
    '*.co.uk',
    // A * host in any form.
    '<all_urls>',
    '<ALL_URLS>',
    'https://*/',
    '*://*/admin/*',
    '*:8080',
    // *. + a single-label TLD, in any spelling.
    'https://*.com/*',
    '*.uk',
    '*.CO.UK',
    '*.co.uk.',
    '*.xn--p1ai',
    '*.рф',
    // *. + a common multi-part suffix.
    '*.com.au',
    '*.co.jp',
    '*.com.br',
    '*.github.io',
  ])('%j → patternTooBroad', (pattern) => {
    expect(parseWildcard(pattern)).toEqual({ ok: false, error: 'patternTooBroad' });
  });

  it.each([
    ['*.example.com', '*://*.example.com/*'],
    ['*.example.co.uk', '*://*.example.co.uk/*'],
    ['*.my-site.github.io', '*://*.my-site.github.io/*'],
    ['*.localhost', '*://*.localhost/*'],
    // Exact hosts match a single site, so they are never broad.
    ['co.uk', '*://co.uk/*'],
    ['intranet', '*://intranet/*'],
    ['localhost', '*://localhost/*'],
    ['https://192.168.0.1/*', 'https://192.168.0.1/*'],
  ])('%j is specific enough', (pattern, normalized) => {
    expect(normalizeWildcard(pattern)).toEqual({ ok: true, value: normalized });
  });

  it.each([
    ['com', true],
    ['uk', true],
    ['co.uk', true],
    ['com.au', true],
    ['github.io', true],
    ['example.com', false],
    ['example.co.uk', false],
    ['localhost', false],
  ])('isPublicSuffix(%j) → %s', (domain, expected) => {
    expect(isPublicSuffix(domain)).toBe(expected);
  });
});
