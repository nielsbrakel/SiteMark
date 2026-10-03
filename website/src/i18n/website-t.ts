import { type Catalog, createCatalogSource } from '@/lib/i18n/catalog-source';
import { createTranslator, type Translator } from '@/lib/i18n/translate';
import type websiteEn from '../../locales/en/messages.json';
import type { Locale } from './locales';
import type { SharedMessageKey } from './shared-keys';

/** Every key in website/locales/en/messages.json. A typo is a type error. */
export type WebsiteMessageKey = keyof typeof websiteEn;

export type WebsiteTranslator = Translator<WebsiteMessageKey | SharedMessageKey>;

// One chunk per locale: a page only loads the catalogs of its own language.
const loaders: Record<Locale, () => Promise<{ default: Catalog }[]>> = {
  en: () =>
    Promise.all([
      import('../../locales/en/messages.json'),
      import('../../../public/_locales/en/messages.json'),
    ]),
  nl: () =>
    Promise.all([
      import('../../locales/nl/messages.json'),
      import('../../../public/_locales/nl/messages.json'),
    ]),
};

/** The website catalog and the extension catalog of one locale (loaded per locale, not inlined). */
export async function loadCatalogs(locale: Locale): Promise<readonly Catalog[]> {
  const modules = await loaders[locale]();
  return modules.map((module) => module.default);
}

/** The shared translator (D-247) over the catalogs of the route's locale. */
export function createWebsiteTranslator(
  locale: Locale,
  catalogs: readonly Catalog[],
): WebsiteTranslator {
  return createTranslator(createCatalogSource(locale, catalogs));
}
