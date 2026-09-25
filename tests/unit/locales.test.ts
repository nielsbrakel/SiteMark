import { describe, expect, it } from 'vitest';
import en from '../../public/_locales/en/messages.json';
import nl from '../../public/_locales/nl/messages.json';

describe('REQ-I18N-001 every string exists in every supported locale', () => {
  it('nl has exactly the same message keys as en', () => {
    expect(Object.keys(nl).sort()).toEqual(Object.keys(en).sort());
  });

  it('has no empty messages', () => {
    for (const [locale, messages] of Object.entries({ en, nl })) {
      for (const [key, { message }] of Object.entries(messages)) {
        expect(message.trim(), `${locale}.${key}`).not.toBe('');
      }
    }
  });
});
