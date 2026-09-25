import { describe, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import { applyDocumentLocale, browserSource, t, tp } from './browser-source';

describe('REQ-I18N-001 the extension reads UI strings through browser.i18n', () => {
  it('returns the message for a key', () => {
    expect(t('extName')).toBe('SiteMark');
  });

  it('reports a missing message as undefined and throws outside production builds', () => {
    vi.spyOn(browser.i18n, 'getMessage').mockReturnValue('');
    expect(browserSource.get('popupTitle', [])).toBeUndefined();
    expect(() => t('popupTitle')).toThrow(/Missing i18n message: popupTitle/);
  });

  it('uses the browser UI language as the locale', () => {
    vi.spyOn(browser.i18n, 'getUILanguage').mockReturnValue('nl');
    expect(browserSource.locale).toBe('nl');
  });
});

describe('REQ-I18N-004 plurals and document locale in the extension', () => {
  it('picks the plural form', () => {
    expect(tp('siteGroupCount', 1)).toBe('1 site group');
    expect(tp('siteGroupCount', 3)).toBe('3 site groups');
  });

  it('sets lang and dir on <html>', () => {
    vi.spyOn(browser.i18n, 'getUILanguage').mockReturnValue('nl');
    applyDocumentLocale(document);
    expect(document.documentElement.lang).toBe('nl');
    expect(document.documentElement.dir).toBe('ltr');
  });
});
