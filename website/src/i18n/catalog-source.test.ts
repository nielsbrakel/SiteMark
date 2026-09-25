import { describe, expect, it } from 'vitest';
import { createTranslator } from '@/lib/i18n/translate';
import { type Catalog, createCatalogSource, duplicateKeys } from './catalog-source';
import { createWebsiteTranslator, loadCatalogs } from './website-t';

const website: Catalog = {
  websiteHello: { message: 'Hello $NAME$', placeholders: { name: { content: '$1' } } },
  websitePrice: { message: 'Costs $$$1' },
  websiteFiles_one: { message: '$COUNT$ file', placeholders: { count: { content: '$1' } } },
  websiteFiles_other: { message: '$COUNT$ files', placeholders: { count: { content: '$1' } } },
};
const extension: Catalog = { extName: { message: 'SiteMark' } };

describe('REQ-WEBUX-003 the website reads JSON catalogs through the shared translator (D-247)', () => {
  it('finds messages in every catalog and reports its locale', () => {
    const source = createCatalogSource('nl', [website, extension]);
    expect(source.locale).toBe('nl');
    expect(source.get('extName', [])).toBe('SiteMark');
    expect(source.get('websiteMissing', [])).toBeUndefined();
  });

  it('formats like chrome.i18n: named placeholders, then $1 substitutions and $$', () => {
    const source = createCatalogSource('en', [website]);
    expect(source.get('websiteHello', ['Ada'])).toBe('Hello Ada');
    expect(source.get('websitePrice', ['5'])).toBe('Costs $5');
  });

  it('gives the shared translator its plurals and loud missing keys', () => {
    type Key = 'websiteFiles_one' | 'websiteFiles_other';
    const { t, tp } = createTranslator<Key>(createCatalogSource('nl', [website]));
    expect(tp('websiteFiles', 1)).toBe('1 file');
    expect(tp('websiteFiles', 1200)).toBe('1.200 files');
    expect(() => t('websiteMissing' as Key)).toThrow(/Missing i18n message/);
  });

  it('refuses a key that two catalogs define', () => {
    const clash: Catalog = { extName: { message: 'Other' } };
    expect(duplicateKeys([website, extension, clash])).toEqual(['extName']);
    expect(duplicateKeys([website, extension])).toEqual([]);
    expect(() => createCatalogSource('en', [extension, clash])).toThrow(/extName/);
  });

  it('translates website and shared extension keys in the route locale', async () => {
    const nl = createWebsiteTranslator('nl', await loadCatalogs('nl'));
    expect(nl.t('websiteHomeHeading')).toBe('Verwar productie nooit meer met test');
    expect(nl.t('extName')).toBe('SiteMark');
    const en = createWebsiteTranslator('en', await loadCatalogs('en'));
    expect(en.t('websiteHomeHeading')).toBe('Never confuse production with test again');
  });
});
