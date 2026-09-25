import { describe, expect, it } from 'vitest';
import en from '../../public/_locales/en/messages.json';
import { createFakeI18n } from './i18n';

describe('REQ-NFR-004 fake i18n reads the real English messages', () => {
  it('returns the en message for a key', () => {
    const { api } = createFakeI18n();
    expect(api.getMessage('extName')).toBe(en.extName.message);
  });

  it('throws on an unknown key so typos fail tests', () => {
    const { api } = createFakeI18n();
    expect(() => api.getMessage('noSuchKey')).toThrow(/Unknown i18n key: noSuchKey/);
  });

  it('fills named placeholders and positional substitutions', () => {
    const { api } = createFakeI18n({
      greet: { message: 'Hi $NAME$, $2 left', placeholders: { name: { content: '$1' } } },
    });
    expect(api.getMessage('greet', ['Ada', '3'])).toBe('Hi Ada, 3 left');
    expect(api.getMessage('greet', 'Ada')).toBe('Hi Ada, $2 left');
  });

  it('answers the predefined @@ messages', () => {
    expect(createFakeI18n().api.getMessage('@@bidi_dir')).toBe('ltr');
    expect(createFakeI18n(undefined, 'he').api.getMessage('@@bidi_dir')).toBe('rtl');
    expect(createFakeI18n(undefined, 'pt-BR').api.getMessage('@@ui_locale')).toBe('pt_BR');
  });

  it('reports the UI language', () => {
    expect(createFakeI18n(undefined, 'nl').api.getUILanguage()).toBe('nl');
  });
});
