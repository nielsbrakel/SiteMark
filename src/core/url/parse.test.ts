import { describe, expect, it } from 'vitest';
import type { UrlPatternErrorCode } from '../errors';
import { normalizeWildcard, parseWildcard } from './parse';

describe('REQ-URL-001 wildcard patterns parse into scheme, host, port and path', () => {
  it('splits a full pattern', () => {
    expect(parseWildcard('https://*.example.com:8443/admin/*')).toEqual({
      ok: true,
      value: {
        scheme: 'https',
        host: 'example.com',
        includeSubdomains: true,
        port: 8443,
        path: '/admin/*',
        matchesQuery: false,
      },
    });
  });

  it('matches the query only when the path contains ?', () => {
    const parsed = parseWildcard('https://example.com/a?x=*');
    expect(parsed.ok && parsed.value).toMatchObject({ path: '/a?x=*', matchesQuery: true });
  });

  it.each([
    ['https://*.example.com/*', 'https://*.example.com/*'],
    ['*://example.com/admin/*', '*://example.com/admin/*'],
    ['https://example.com/admin', 'https://example.com/admin'],
    ['https://example.com/a?x=*', 'https://example.com/a?x=*'],
    ['https://example.com/', 'https://example.com/'],
    ['https://example.com', 'https://example.com/*'],
    ['HTTPS://Example.COM', 'https://example.com/*'],
    ['https://EXAMPLE.com/Path', 'https://example.com/Path'],
    ['http://127.0.0.1:8080/*', 'http://127.0.0.1:8080/*'],
    ['https://example.com:0443/', 'https://example.com:443/'],
    ['https://my_host.internal/', 'https://my_host.internal/'],
    ['https://example.com/app#/admin', 'https://example.com/app'],
    ['  https://example.com/x  ', 'https://example.com/x'],
  ])('normalizes %j to %j', (input, expected) => {
    expect(normalizeWildcard(input)).toEqual({ ok: true, value: expected });
  });

  it.each([
    ['bücher.de', '*://xn--bcher-kva.de/*'],
    ['*.bücher.de', '*://*.xn--bcher-kva.de/*'],
    ['BÜCHER.de', '*://xn--bcher-kva.de/*'],
    ['bu\u0308cher.de', '*://xn--bcher-kva.de/*'],
    ['bücher\u3002de', '*://xn--bcher-kva.de/*'],
    ['example.com.', '*://example.com/*'],
    ['https://example.com.:8080/', 'https://example.com:8080/'],
  ])('IDN and trailing dot: %j → %j', (input, expected) => {
    expect(normalizeWildcard(input)).toEqual({ ok: true, value: expected });
  });

  it.each([
    ['[::1]:3000', '*://[::1]:3000/*'],
    ['http://[0:0:0:0:0:0:0:1]/', 'http://[::1]/'],
    ['[2001:DB8::0:1]', '*://[2001:db8::1]/*'],
    ['[1:0:0:2:0:0:0:3]', '*://[1:0:0:2::3]/*'],
    ['[1:2:3:4:5:6:7:0]', '*://[1:2:3:4:5:6:7:0]/*'],
    ['[::ffff:192.168.0.1]', '*://[::ffff:c0a8:1]/*'],
  ])('IPv6 in brackets: %j → %j', (input, expected) => {
    expect(normalizeWildcard(input)).toEqual({ ok: true, value: expected });
  });

  it.each([
    ['https://example.com/über', 'https://example.com/%C3%BCber'],
    ['https://example.com/a b?q=ü', 'https://example.com/a%20b?q=%C3%BC'],
  ])('percent-encodes the path like a browser: %j → %j', (input, expected) => {
    expect(normalizeWildcard(input)).toEqual({ ok: true, value: expected });
  });
});

describe('REQ-URL-002 shorthand patterns without a scheme', () => {
  it.each([
    ['example.com', '*://example.com/*'],
    ['*.example.com', '*://*.example.com/*'],
    ['localhost:3000', '*://localhost:3000/*'],
    ['localhost', '*://localhost/*'],
    ['example.com/admin/*', '*://example.com/admin/*'],
    ['example.com?x=1', '*://example.com/?x=1'],
  ])('%j means %j', (input, expected) => {
    expect(normalizeWildcard(input)).toEqual({ ok: true, value: expected });
  });

  it('defaults the path to /* and the port to any', () => {
    expect(parseWildcard('example.com')).toEqual({
      ok: true,
      value: {
        scheme: '*',
        host: 'example.com',
        includeSubdomains: false,
        port: undefined,
        path: '/*',
        matchesQuery: false,
      },
    });
  });
});

describe('REQ-URL-003 invalid patterns are rejected with a typed error code', () => {
  const cases: [string, UrlPatternErrorCode][] = [
    ['', 'patternEmpty'],
    ['   ', 'patternEmpty'],
    ['https://ex*ple.com/*', 'patternWildcardInHost'],
    ['https://*example.com/', 'patternWildcardInHost'],
    ['https://*.*.example.com/', 'patternWildcardInHost'],
    ['https://example.*/', 'patternWildcardInHost'],
    ['file:///C:/x', 'patternInvalidScheme'],
    ['ftp://example.com', 'patternInvalidScheme'],
    ['chrome://extensions', 'patternInvalidScheme'],
    ['ht*p://example.com', 'patternInvalidScheme'],
    ['javascript:alert(1)', 'patternInvalidScheme'],
    ['about:blank', 'patternInvalidScheme'],
    ['data:text/html,x', 'patternInvalidScheme'],
    ['https://', 'patternInvalidHost'],
    ['https:///path', 'patternInvalidHost'],
    ['https://exa mple.com/', 'patternInvalidHost'],
    ['https://user@example.com/', 'patternInvalidHost'],
    ['https://example..com/', 'patternInvalidHost'],
    ['https://.example.com/', 'patternInvalidHost'],
    ['example.com..', 'patternInvalidHost'],
    [`${'a'.repeat(64)}.com`, 'patternInvalidHost'],
    [`${'abcdefghi.'.repeat(26)}com`, 'patternInvalidHost'],
    ['https://1.2.3/', 'patternInvalidHost'],
    ['https://256.1.1.1/', 'patternInvalidHost'],
    ['https://01.2.3.4/', 'patternInvalidHost'],
    ['https://*.1.2.3.4/', 'patternInvalidHost'],
    ['*.[::1]', 'patternInvalidHost'],
    ['[::1]x', 'patternInvalidHost'],
    ['example.com:', 'patternInvalidPort'],
    ['example.com:abc', 'patternInvalidPort'],
    ['localhost:abc', 'patternInvalidPort'],
    ['example.com:65536', 'patternInvalidPort'],
    ['example.com:*', 'patternInvalidPort'],
    ['example.com:80:80', 'patternInvalidPort'],
    ['[::1]:abc', 'patternInvalidPort'],
    ['[::1', 'patternInvalidIpv6'],
    ['[::g]', 'patternInvalidIpv6'],
    ['[1:2:3:4:5:6:7:8:9]', 'patternInvalidIpv6'],
    ['[1::2::3]', 'patternInvalidIpv6'],
    ['[1:2:3:4:5:6:7]', 'patternInvalidIpv6'],
    ['[::1.2.3]', 'patternInvalidIpv6'],
    ['::1', 'patternInvalidIpv6'],
    ['https://2001:db8::1/', 'patternInvalidIpv6'],
  ];

  it.each(cases)('%j → %s', (input, code) => {
    expect(parseWildcard(input)).toEqual({ ok: false, error: code });
    expect(normalizeWildcard(input)).toEqual({ ok: false, error: code });
  });
});
