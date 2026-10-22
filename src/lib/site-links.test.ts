import { describe, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import { helpUrl } from './site-links';

describe('REQ-POP-008 REQ-OPT-008 the extension links to the help topics of the website', () => {
  it('links the help index and each topic', () => {
    expect(helpUrl()).toBe('https://nielsbrakel.github.io/SiteMark/help/');
    expect(helpUrl('url-patterns')).toBe(
      'https://nielsbrakel.github.io/SiteMark/help/url-patterns/',
    );
  });

  it('links the Dutch pages in a Dutch browser', () => {
    vi.spyOn(browser.i18n, 'getUILanguage').mockReturnValue('nl');
    expect(helpUrl('troubleshooting')).toBe(
      'https://nielsbrakel.github.io/SiteMark/nl/help/troubleshooting/',
    );
  });
});
