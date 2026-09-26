import { describe, expect, it } from 'vitest';
import type { OriginPattern } from '../core/url/origin';
import { grantPageOrigins, grantPageUrl } from './grant-page';

const PROD = 'https://prod.example.com/*' as OriginPattern;
const ANY = '*://*.example.org/*' as OriginPattern;

const searchOf = (url: string) => new URL(url).search;

describe('REQ-PRIV-002 REQ-PICK-006 the grant page link carries only valid origins', () => {
  it('points at the extension grant page with the origins in ?origins=', () => {
    const url = grantPageUrl([PROD, ANY]);
    expect(url.split('?')[0]).toBe('chrome-extension://test-extension-id/grant.html');
    expect(new URL(url).searchParams.get('origins')).toBe(`${PROD},${ANY}`);
  });

  it('reads back the origins it was built with, each once', () => {
    expect(grantPageOrigins(searchOf(grantPageUrl([PROD, ANY, PROD])))).toEqual([PROD, ANY]);
  });

  it.each([
    ['no origins parameter', ''],
    ['an empty list', '?origins='],
    ['an empty entry', `?origins=${encodeURIComponent(`${PROD},`)}`],
    ['every site', `?origins=${encodeURIComponent('<all_urls>')}`],
    ['a too broad pattern', `?origins=${encodeURIComponent('*://*/*')}`],
    ['a non-canonical origin', `?origins=${encodeURIComponent('https://prod.example.com')}`],
    ['a path', `?origins=${encodeURIComponent('https://prod.example.com/admin/*')}`],
    ['a script URL', `?origins=${encodeURIComponent('javascript:alert(1)')}`],
    ['one bad entry among good ones', `?origins=${encodeURIComponent(`${PROD},file:///*`)}`],
  ])('rejects %s', (_, search) => {
    expect(grantPageOrigins(search)).toBeUndefined();
  });
});
