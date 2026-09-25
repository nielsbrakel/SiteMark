import { describe, expect, it } from 'vitest';
import en from '../../public/_locales/en/messages.json';
import nl from '../../public/_locales/nl/messages.json';

type Entry = {
  message: string;
  description?: string;
  placeholders?: Record<string, { content: string; example?: string }>;
};
const locales: Record<string, Record<string, Entry>> = { en, nl };
const entries = Object.entries(locales).flatMap(([locale, messages]) =>
  Object.entries(messages).map(([key, entry]) => ({ locale, key, entry })),
);
const named = (message: string) =>
  [...message.matchAll(/\$([a-z0-9_@]+)\$/gi)].map((m) => m[1]?.toLowerCase()).sort();

describe('REQ-I18N-001 every string exists in every supported locale', () => {
  it('nl has exactly the same message keys as en', () => {
    expect(Object.keys(nl).sort()).toEqual(Object.keys(en).sort());
  });

  it('has no empty messages', () => {
    for (const { locale, key, entry } of entries) {
      expect(entry.message.trim(), `${locale}.${key}`).not.toBe('');
    }
  });

  it('uses the same placeholders in every locale', () => {
    for (const [key, entry] of Object.entries(en as Record<string, Entry>)) {
      const other = (nl as Record<string, Entry>)[key];
      expect(Object.keys(other?.placeholders ?? {}).sort(), key).toEqual(
        Object.keys(entry.placeholders ?? {}).sort(),
      );
    }
  });
});

describe('REQ-I18N-004 placeholders and plurals are translator-friendly', () => {
  it('declares every $NAME$ a message uses', () => {
    for (const { locale, key, entry } of entries) {
      const declared = Object.keys(entry.placeholders ?? {}).map((name) => name.toLowerCase());
      for (const name of named(entry.message)) expect(declared, `${locale}.${key}`).toContain(name);
    }
  });

  it('describes every message with placeholders and gives each placeholder an example', () => {
    const withPlaceholders = entries.filter(({ entry }) => entry.placeholders);
    for (const { locale, key, entry } of withPlaceholders) {
      expect(entry.description, `${locale}.${key} needs a description`).toBeTruthy();
      const examples = Object.values(entry.placeholders ?? {}).map((p) => p.example);
      expect(examples.every(Boolean), `${locale}.${key} placeholder examples`).toBe(true);
    }
  });

  it('never uses positional $1 directly in a message', () => {
    for (const { locale, key, entry } of entries) {
      expect(entry.message, `${locale}.${key}`).not.toMatch(/\$\d/);
    }
  });

  it('pairs every _one message with an _other message', () => {
    for (const key of Object.keys(en).filter((k) => k.endsWith('_one'))) {
      expect(Object.keys(en), key).toContain(key.replace(/_one$/, '_other'));
    }
  });
});

describe('REQ-I18N-005 store texts fit the store limits', () => {
  it.each(Object.keys(locales))('%s name ≤ 45 and description ≤ 132 characters', (locale) => {
    const messages = locales[locale] ?? {};
    expect(messages.extName?.message.length).toBeLessThanOrEqual(45);
    expect(messages.extDescription?.message.length).toBeLessThanOrEqual(132);
  });
});
