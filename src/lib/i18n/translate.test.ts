import { describe, expect, it } from 'vitest';
import { createTranslator, type MessageSource } from './translate';

type Key = 'hello' | 'files_one' | 'files_other' | 'only_other';

/** In-memory source: `$1`… are replaced like chrome.i18n does after placeholder expansion. */
function catalog(messages: Partial<Record<string, string>>, locale = 'en'): MessageSource {
  return {
    locale,
    get: (key, substitutions) =>
      messages[key]?.replace(/\$(\d)/g, (m, n: string) => substitutions[Number(n) - 1] ?? m),
  };
}

const messages = {
  hello: 'Hello $1',
  files_one: '$1 file',
  files_other: '$1 files',
  only_other: '$1 things',
};

describe('REQ-I18N-001 the shared translator reads messages through a MessageSource (D-247)', () => {
  it('returns the message with substitutions', () => {
    const { t } = createTranslator<Key>(catalog(messages));
    expect(t('hello', 'Ada')).toBe('Hello Ada');
    expect(t('hello', ['Ada'])).toBe('Hello Ada');
  });

  it('throws on a missing message by default', () => {
    const { t } = createTranslator<Key>(catalog({}));
    expect(() => t('hello')).toThrow(/Missing i18n message: hello/);
  });

  it('falls back to the key when told to (production builds)', () => {
    const { t } = createTranslator<Key>(catalog({}), { onMissing: 'key' });
    expect(t('hello')).toBe('hello');
  });
});

describe('REQ-I18N-004 the shared translator picks plural forms for the source locale', () => {
  it('uses Intl.PluralRules and a locale-formatted count as $1', () => {
    const { tp } = createTranslator<Key>(catalog(messages));
    expect(tp('files', 1)).toBe('1 file');
    expect(tp('files', 2)).toBe('2 files');
    expect(tp('files', 1200)).toBe('1,200 files');
    expect(createTranslator<Key>(catalog(messages, 'nl')).tp('files', 1200)).toBe('1.200 files');
  });

  it('falls back to _other when the locale has a category without a message', () => {
    const { tp } = createTranslator<Key>(catalog(messages));
    expect(tp('only', 1)).toBe('1 things');
  });
});
