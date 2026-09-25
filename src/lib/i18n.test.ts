import { describe, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import { applyDocumentLocale, t, tp } from './i18n';

describe('REQ-I18N-001 t() reads UI strings from the locale files', () => {
  it('returns the message for a key', () => {
    expect(t('extName')).toBe('SiteMark');
  });

  it('throws on a missing message outside production builds', () => {
    vi.spyOn(browser.i18n, 'getMessage').mockReturnValue('');
    expect(() => t('popupTitle')).toThrow(/Missing i18n message: popupTitle/);
  });
});

describe('REQ-I18N-004 plurals and document locale', () => {
  it('picks the plural form with Intl.PluralRules and passes the count', () => {
    expect(tp('siteGroupCount', 1)).toBe('1 site group');
    expect(tp('siteGroupCount', 0)).toBe('0 site groups');
    expect(tp('siteGroupCount', 3)).toBe('3 site groups');
  });

  it('formats the count for the UI language', () => {
    expect(tp('siteGroupCount', 1200)).toBe('1,200 site groups');
  });

  it('sets lang and dir on <html>', () => {
    vi.spyOn(browser.i18n, 'getUILanguage').mockReturnValue('nl');
    applyDocumentLocale(document);
    expect(document.documentElement.lang).toBe('nl');
    expect(document.documentElement.dir).toBe('ltr');
  });
});
