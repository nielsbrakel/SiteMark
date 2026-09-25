import { describe, expect, it } from 'vitest';
import extensionEn from '../../../public/_locales/en/messages.json';
import extensionNl from '../../../public/_locales/nl/messages.json';
import en from '../../locales/en/messages.json';
import nl from '../../locales/nl/messages.json';
import { type Catalog, type CatalogEntry, duplicateKeys } from '../../src/i18n/catalog-source';

type Entry = CatalogEntry & {
  placeholders?: Record<string, { content: string; example?: string }>;
};
const locales: Record<string, Record<string, Entry>> = { en, nl };
const entries = Object.entries(locales).flatMap(([locale, messages]) =>
  Object.entries(messages).map(([key, entry]) => ({ locale, key, entry })),
);
const named = (message: string) =>
  [...message.matchAll(/\$([a-z0-9_@]+)\$/gi)].map((m) => m[1]?.toLowerCase()).sort();

describe('REQ-WEBUX-003 every website string exists in English and Dutch', () => {
  it('nl has exactly the same keys as en', () => {
    expect(Object.keys(nl).sort()).toEqual(Object.keys(en).sort());
  });

  it('has no empty messages', () => {
    for (const { locale, key, entry } of entries) {
      expect(entry.message.trim(), `${locale}.${key}`).not.toBe('');
    }
  });

  it('uses the same placeholders in both locales and declares every $NAME$', () => {
    for (const [key, entry] of Object.entries(en as Record<string, Entry>)) {
      const other = (nl as Record<string, Entry>)[key];
      expect(Object.keys(other?.placeholders ?? {}).sort(), key).toEqual(
        Object.keys(entry.placeholders ?? {}).sort(),
      );
    }
    for (const { locale, key, entry } of entries) {
      const declared = Object.keys(entry.placeholders ?? {}).map((name) => name.toLowerCase());
      for (const name of named(entry.message)) expect(declared, `${locale}.${key}`).toContain(name);
    }
  });

  it('describes every message for translators', () => {
    for (const { locale, key, entry } of entries) {
      expect(entry.description, `${locale}.${key}`).toBeTruthy();
    }
  });
});

describe('REQ-WEBUX-003 website keys never duplicate extension keys (D-247)', () => {
  it('prefixes every website key with "website"', () => {
    expect(Object.keys(en).filter((key) => !key.startsWith('website'))).toEqual([]);
  });

  it.each([
    ['en', en, extensionEn],
    ['nl', nl, extensionNl],
  ] as const)('%s: no key is in both catalogs', (_locale, website, extension) => {
    expect(duplicateKeys([website as Catalog, extension as Catalog])).toEqual([]);
  });
});
