import { describe, expect, it } from 'vitest';
import { parseUrl } from './url-parts';

describe('REQ-URL-001 URLs are split into comparable parts', () => {
  it('drops the fragment and splits scheme, host, port, path and query', () => {
    expect(parseUrl('https://a.b.example.com/x?y=1#z')).toEqual({
      href: 'https://a.b.example.com/x?y=1',
      scheme: 'https',
      host: 'a.b.example.com',
      port: 443,
      path: '/x',
      query: 'y=1',
    });
  });

  it('uses the default port of the scheme when none is given', () => {
    expect(parseUrl('http://example.com/')?.port).toBe(80);
    expect(parseUrl('https://example.com/')?.port).toBe(443);
    expect(parseUrl('http://localhost:5173/')?.port).toBe(5173);
    expect(parseUrl('ws://example.com/')?.port).toBeUndefined();
  });

  it('keeps IPv6 hosts in brackets, in canonical form', () => {
    expect(parseUrl('http://[::1]:3000/')).toMatchObject({ host: '[::1]', port: 3000 });
    expect(parseUrl('http://[0:0:0:0:0:0:0:1]/')?.host).toBe('[::1]');
  });

  it('lowercases the host, drops a trailing dot and keeps the path case', () => {
    expect(parseUrl('HTTPS://EXAMPLE.com./Path')).toMatchObject({
      scheme: 'https',
      host: 'example.com',
      path: '/Path',
    });
  });

  it('converts a non-ASCII host to punycode', () => {
    expect(parseUrl('https://bücher.de/x')?.host).toBe('xn--bcher-kva.de');
    expect(parseUrl('https://xn--bcher-kva.de/x')?.host).toBe('xn--bcher-kva.de');
  });

  it('defaults the path to / and tells an empty query from no query', () => {
    expect(parseUrl('https://example.com')).toMatchObject({ path: '/', query: undefined });
    expect(parseUrl('https://example.com?q')).toMatchObject({ path: '/', query: 'q' });
    expect(parseUrl('https://example.com/a?')).toMatchObject({ path: '/a', query: '' });
    expect(parseUrl('https://example.com/#top')).toMatchObject({
      href: 'https://example.com/',
      query: undefined,
    });
  });

  it('ignores user info', () => {
    expect(parseUrl('https://user:pw@example.com/')?.host).toBe('example.com');
  });

  it.each([
    '',
    'not a url',
    'about:blank',
    'file:///C:/x',
    'https://',
    'https://[::1/',
    'https://exa mple.com/',
  ])('returns undefined for %j', (url) => {
    expect(parseUrl(url)).toBeUndefined();
  });
});
