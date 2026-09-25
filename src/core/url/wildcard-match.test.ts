import { describe, expect, it } from 'vitest';
import { parseWildcard } from './parse';
import { parseUrl } from './url-parts';
import { matchWildcard } from './wildcard-match';

/** Parses both sides; an unparsable URL never matches. */
function matches(pattern: string, url: string): boolean {
  const parsed = parseWildcard(pattern);
  expect(parsed, pattern).toMatchObject({ ok: true });
  const parts = parseUrl(url);
  return parsed.ok && parts !== undefined && matchWildcard(parsed.value, parts);
}

describe('REQ-URL-001 REQ-URL-002 acceptance examples (spec §5.1)', () => {
  it.each([
    ['https://*.example.com/*', 'https://example.com/', true],
    ['https://*.example.com/*', 'https://a.b.example.com/x?y=1#z', true],
    ['https://*.example.com/*', 'http://example.com/', false],
    ['https://*.example.com/*', 'https://notexample.com/', false],
    ['*://example.com/admin/*', 'http://example.com/admin/users', true],
    ['*://example.com/admin/*', 'https://example.com/administrator', false],
    ['https://example.com/admin', 'https://example.com/admin?tab=1', true],
    ['https://example.com/admin', 'https://example.com/admin/', false],
    ['https://example.com/a?x=*', 'https://example.com/a?x=1', true],
    ['example.com', 'https://example.com:8443/anything', true],
    ['example.com/admin/*', 'http://example.com/admin/x', true],
    ['localhost:3000', 'http://localhost:3001/', false],
    ['localhost', 'http://localhost:5173/', true],
    ['[::1]:3000', 'http://[::1]:3000/', true],
    ['bücher.de', 'https://xn--bcher-kva.de/x', true],
    ['example.com.', 'https://example.com/', true],
    ['https://EXAMPLE.com/Path', 'https://example.com/Path', true],
    ['https://example.com/Path', 'https://example.com/path', false],
  ])('%j vs %j → %s', (pattern, url, expected) => {
    expect(matches(pattern, url)).toBe(expected);
  });

  it.each([
    ['https://ex*ple.com/*', 'patternWildcardInHost'],
    ['file:///C:/x', 'patternInvalidScheme'],
  ])('%j is invalid (%s)', (pattern, code) => {
    expect(parseWildcard(pattern)).toEqual({ ok: false, error: code });
  });
});

describe('REQ-URL-001 wildcard matching details', () => {
  it.each([
    // Scheme: * is http or https only.
    ['*://example.com/*', 'ftp://example.com/', false],
    ['*://example.com/*', 'wss://example.com/', false],
    ['http://example.com/*', 'HTTP://example.com/', true],
    // Host: the domain itself and its subdomains, nothing else.
    ['*.example.com', 'https://deep.a.example.com/', true],
    ['*.example.com', 'https://example.com.evil.test/', false],
    ['*.example.com', 'https://evil-example.com/', false],
    ['example.com', 'https://www.example.com/', false],
    ['example.com', 'https://EXAMPLE.COM./', true],
    // Port: an explicit pattern port is compared with the URL's effective port.
    ['https://example.com:443/*', 'https://example.com/', true],
    ['*://example.com:443/*', 'http://example.com/', false],
    ['localhost:3000', 'http://localhost:3000/app', true],
    // Query and fragment.
    ['https://example.com/a?x=*', 'https://example.com/a', false],
    ['https://example.com/a?x=*', 'https://example.com/a?x=1#frag', true],
    ['https://example.com/a?x=1', 'https://example.com/a?x=1&y=2', false],
    ['https://example.com/a', 'https://example.com/a#frag', true],
    // The path is compared in its percent-encoded form.
    ['https://example.com/über', 'https://example.com/%C3%BCber', true],
    // IPv4 and IPv6 hosts.
    ['http://127.0.0.1/*', 'http://127.0.0.1:8080/x', true],
    ['[0:0::1]', 'http://[::1]/', true],
  ])('%j vs %j → %s', (pattern, url, expected) => {
    expect(matches(pattern, url)).toBe(expected);
  });

  it('never matches a URL that is not http(s)', () => {
    expect(matches('*://example.com/*', 'about:blank')).toBe(false);
  });
});
