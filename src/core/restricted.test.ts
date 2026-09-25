import { describe, expect, it } from 'vitest';
import { isKnownRestrictedUrl } from './restricted';

describe('REQ-POP-005 REQ-ENV-003 restricted-URL hint: browser pages and other schemes', () => {
  it.each([
    'chrome://extensions/',
    'chrome://newtab/',
    'CHROME://SETTINGS',
    'edge://settings/profiles',
    'about:blank',
    'about:addons',
    'moz-extension://0f2c3b1a-1111-4e5f-9a7b-123456789abc/options.html',
    'chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/index.html',
    'safari-web-extension://ABCDEF/popup.html',
    'file:///Users/me/notes.html',
    'view-source:https://example.com/',
    'data:text/html,<p>hi</p>',
    'blob:https://example.com/0f2c3b1a-1111-4e5f-9a7b-123456789abc',
    'javascript:void(0)',
    'ftp://example.com/file.txt',
    'brave://settings',
  ])('%s is restricted', (url) => {
    expect(isKnownRestrictedUrl(url)).toBe(true);
  });

  it.each(['', 'example.com', '/relative/path', 'https:no-slashes', '://missing-scheme'])(
    'treats %j, which is not an http(s) URL, as restricted',
    (url) => {
      expect(isKnownRestrictedUrl(url)).toBe(true);
    },
  );
});

describe('REQ-POP-005 REQ-ENV-003 restricted-URL hint: extension stores', () => {
  it.each([
    'https://chromewebstore.google.com/',
    'https://chromewebstore.google.com/detail/sitemark/abcdefghijklmnopabcdefghijklmnop',
    'https://CHROMEWEBSTORE.GOOGLE.COM/category/extensions',
    'https://chromewebstore.google.com:443/',
    'https://user@chromewebstore.google.com/',
    'https://chromewebstore.google.com./',
    'https://chrome.google.com/webstore',
    'https://chrome.google.com/webstore/detail/x/abc',
    'https://chrome.google.com/webstore?hl=nl',
    'https://microsoftedge.microsoft.com/addons',
    'https://microsoftedge.microsoft.com/addons/detail/sitemark/abc',
    'https://addons.mozilla.org/en-US/firefox/addon/sitemark/',
    'http://addons.mozilla.org',
  ])('%s is restricted', (url) => {
    expect(isKnownRestrictedUrl(url)).toBe(true);
  });

  it.each([
    'https://chrome.google.com/',
    'https://chrome.google.com/webstorefront',
    'https://www.google.com/chrome/',
    'https://microsoftedge.microsoft.com/',
    'https://microsoftedge.microsoft.com/addonsx',
    'https://addons.mozilla.org.example.com/',
    'https://notaddons.mozilla.org/',
    'https://example.com/addons.mozilla.org',
    'https://example.com/?next=https://chromewebstore.google.com/',
  ])('%s is not a store page', (url) => {
    expect(isKnownRestrictedUrl(url)).toBe(false);
  });
});

describe('REQ-POP-005 REQ-ENV-003 restricted-URL hint: PDFs in the built-in viewer', () => {
  it.each([
    'https://example.com/report.pdf',
    'https://example.com/docs/Report.PDF?download=1',
    'http://example.com/a.pdf#page=2',
  ])('%s is restricted', (url) => {
    expect(isKnownRestrictedUrl(url)).toBe(true);
  });

  it.each([
    'https://example.com/pdf-guide',
    'https://example.com/file.pdf.html',
    'https://example.com/?file=a.pdf',
    'https://example.com/#a.pdf',
  ])('%s is not a PDF', (url) => {
    expect(isKnownRestrictedUrl(url)).toBe(false);
  });
});

describe('REQ-POP-005 restricted-URL hint: ordinary web pages are not restricted', () => {
  it.each([
    'https://example.com',
    'https://example.com/',
    'HTTPS://EXAMPLE.COM/Path',
    'http://localhost:3000/app',
    'https://admin.example.com/customers/42?tab=orders#notes',
    'https://[::1]:8080/',
    'http://192.168.1.10/',
  ])('%s is not restricted', (url) => {
    expect(isKnownRestrictedUrl(url)).toBe(false);
  });
});
