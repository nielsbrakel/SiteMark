import { describe, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import { t } from './i18n';

describe('REQ-I18N-001 t() reads UI strings from the locale files', () => {
  it('returns the message for a key', () => {
    const getMessage = vi.spyOn(browser.i18n, 'getMessage').mockReturnValue('SiteMark');
    expect(t('extName')).toBe('SiteMark');
    expect(getMessage).toHaveBeenCalledWith('extName', undefined);
  });

  it('falls back to the key when the message is missing', () => {
    vi.spyOn(browser.i18n, 'getMessage').mockReturnValue('');
    expect(t('popupTitle')).toBe('popupTitle');
  });
});
