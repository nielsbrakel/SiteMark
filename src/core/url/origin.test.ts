import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { isOriginPattern, originMatches, parseOriginPattern, toOriginPattern } from './origin';
import { type ParsedWildcard, parseWildcard } from './parse';
import { parseUrl, type UrlParts } from './url-parts';
import { matchWildcard } from './wildcard-match';

function parsed(pattern: string): ParsedWildcard {
  const result = parseWildcard(pattern);
  expect(result, pattern).toMatchObject({ ok: true });
  return (result as { value: ParsedWildcard }).value;
}

function url(text: string): UrlParts {
  const parts = parseUrl(text);
  expect(parts, text).toBeDefined();
  return parts as UrlParts;
}

/** Runs a property and rethrows the failing test's own error, so it reads like any other failure. */
function assertProperty<T>(property: fc.IProperty<T>): void {
  const details = fc.check(property, { numRuns: 500 });
  if (!details.failed) return;
  const error = details.errorInstance;
  if (error instanceof Error) {
    error.message += `\nCounterexample: ${fc.stringify(details.counterexample)}`;
    throw error;
  }
  expect.fail(`Property failed: ${fc.stringify(details.counterexample)}`);
}

describe('REQ-URL-005 origin derivation', () => {
  it.each([
    ['https://*.example.com/admin/*', 'https://*.example.com/*'],
    ['*://example.com:8080/x', '*://example.com/*'],
    ['http://localhost:3000/', 'http://localhost/*'],
    ['https://example.com/a?x=*', 'https://example.com/*'],
    ['[::1]:3000', '*://[::1]/*'],
    ['bücher.de/x', '*://xn--bcher-kva.de/*'],
  ])('%j → %j', (pattern, origin) => {
    expect(toOriginPattern(parsed(pattern))).toBe(origin);
  });

  it('matches any path and any port of the origin', () => {
    const origin = toOriginPattern(parsed('https://*.example.com:8443/admin/*'));
    expect(originMatches(origin, url('https://a.example.com:9000/other?q#f'))).toBe(true);
    expect(originMatches(origin, url('https://example.com/'))).toBe(true);
    expect(originMatches(origin, url('http://example.com/'))).toBe(false);
    expect(originMatches(origin, url('https://notexample.com/'))).toBe(false);
  });

  it('parses origin input into its canonical form', () => {
    expect(parseOriginPattern('https://example.com')).toEqual({
      ok: true,
      value: 'https://example.com/*',
    });
    expect(parseOriginPattern('http://localhost:3000/*')).toEqual({
      ok: true,
      value: 'http://localhost/*',
    });
    expect(parseOriginPattern('*://*/*')).toEqual({ ok: false, error: 'patternTooBroad' });
    expect(parseOriginPattern('ftp://example.com/*')).toEqual({
      ok: false,
      error: 'patternInvalidScheme',
    });
  });

  it.each([
    ['https://example.com/*', true],
    ['*://*.example.co.uk/*', true],
    ['http://[::1]/*', true],
    ['https://example.com/', false],
    ['https://example.com:8080/*', false],
    ['HTTPS://example.com/*', false],
    ['https://*.com/*', false],
    ['*://*/*', false],
    [42, false],
  ])('isOriginPattern(%j) → %s', (value, expected) => {
    expect(isOriginPattern(value)).toBe(expected);
  });
});

const label = fc.stringMatching(/^[a-z0-9]{1,6}$/);
const host = fc.oneof(
  fc.tuple(label, fc.constantFrom('com', 'nl', 'co.uk', 'example')).map(([a, b]) => `${a}.${b}`),
  fc.constantFrom('localhost', '127.0.0.1', '[::1]'),
);
const port = fc.option(fc.integer({ min: 1, max: 65_535 }), { nil: undefined });
const pathPiece = fc.constantFrom('*', 'a', 'B', '/', '?', 'x=1', '.', '%C3%BC');
const fill = fc.stringMatching(/^[a-zA-Z0-9/?=.&]{0,6}$/);

const scenario = fc.record({
  scheme: fc.constantFrom('http', 'https', '*'),
  subdomains: fc.boolean(),
  host,
  port,
  path: fc.array(pathPiece, { maxLength: 8 }).map((pieces) => pieces.join('')),
  urlScheme: fc.constantFrom('http', 'https'),
  subdomain: fc.option(label, { nil: undefined }),
  urlPort: port,
  fills: fc.array(fill, { minLength: 10, maxLength: 10 }),
  fragment: fc.option(fill, { nil: undefined }),
});

type Scenario = typeof scenario extends fc.Arbitrary<infer S> ? S : never;

function patternOf(s: Scenario): string {
  const wildcard = s.subdomains && !s.host.match(/^[\d[]/) ? '*.' : '';
  return `${s.scheme}://${wildcard}${s.host}${s.port ? `:${s.port}` : ''}/${s.path}`;
}

/** A URL built to be close to the pattern: each `*` replaced by a random fill. */
function urlOf(s: Scenario): string {
  let index = 0;
  const path = s.path.replace(/\*/g, () => s.fills[index++] ?? '');
  const sub = s.subdomain && !s.host.match(/^[\d[]/) ? `${s.subdomain}.` : '';
  const urlPort = s.urlPort ?? s.port;
  const hash = s.fragment === undefined ? '' : `#${s.fragment}`;
  return `${s.urlScheme}://${sub}${s.host}${urlPort ? `:${urlPort}` : ''}/${path}${hash}`;
}

describe('REQ-URL-005 property: a pattern match implies an origin match', () => {
  it('holds for generated patterns and nearby URLs', () => {
    let matched = 0;
    assertProperty(
      fc.property(scenario, (s) => {
        const pattern = parseWildcard(patternOf(s));
        const parts = parseUrl(urlOf(s));
        fc.pre(pattern.ok && parts !== undefined);
        if (!(pattern.ok && parts) || !matchWildcard(pattern.value, parts)) return;
        matched++;
        expect(originMatches(toOriginPattern(pattern.value), parts)).toBe(true);
      }),
    );
    expect(matched).toBeGreaterThan(50);
  });

  it('always yields a valid, canonical origin pattern', () => {
    assertProperty(
      fc.property(scenario, (s) => {
        const pattern = parseWildcard(patternOf(s));
        fc.pre(pattern.ok);
        if (!pattern.ok) return;
        const origin = toOriginPattern(pattern.value);
        expect(isOriginPattern(origin)).toBe(true);
        expect(parseOriginPattern(origin)).toEqual({ ok: true, value: origin });
      }),
    );
  });
});
