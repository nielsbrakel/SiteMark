import { afterEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { aState } from '@/core/testing/builders';
import { applyLanguage, t } from '@/lib/i18n/browser-source';
import { applyStoredLanguage } from './stored-language';

const store = (settings: object) =>
  fakeBrowser.storage.local.set({ 'sitemark:state': aState({ settings: settings as never }) });

describe('REQ-I18N-006 a page applies the stored language before it renders', () => {
  afterEach(() => applyLanguage('auto'));

  it('translates from the stored language', async () => {
    await store({ theme: 'system', language: 'nl' });
    await applyStoredLanguage();
    expect(t('optionsTheme')).toBe('Thema');
  });

  it.each([
    ['no language was chosen', { theme: 'system' }],
    ['the language is auto', { theme: 'system', language: 'auto' }],
  ])('keeps the browser language when %s', async (_name, settings) => {
    await store(settings);
    await applyStoredLanguage();
    expect(t('optionsTheme')).toBe('Theme');
  });

  it('keeps the browser language when nothing is stored yet', async () => {
    await applyStoredLanguage();
    expect(t('optionsTheme')).toBe('Theme');
  });
});
