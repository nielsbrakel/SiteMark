import { notImplemented } from '@/core/not-implemented';
import type { Translator } from '@/lib/i18n/translate';
import type extensionEn from '../../../public/_locales/en/messages.json';
import type websiteEn from '../../locales/en/messages.json';
import type { Catalog } from './catalog-source';
import type { Locale } from './locales';

/** Every key in website/locales/en/messages.json. A typo is a type error. */
export type WebsiteMessageKey = keyof typeof websiteEn;

/** Keys from public/_locales, for strings that reused extension components show. */
type SharedMessageKey = keyof typeof extensionEn;

export type WebsiteTranslator = Translator<WebsiteMessageKey | SharedMessageKey>;

/** The website catalog and the extension catalog of one locale (loaded per locale, not inlined). */
export function loadCatalogs(_locale: Locale): Promise<readonly Catalog[]> {
  return notImplemented();
}

/** The shared translator (D-247) over the catalogs of the route's locale. */
export function createWebsiteTranslator(
  _locale: Locale,
  _catalogs: readonly Catalog[],
): WebsiteTranslator {
  return notImplemented();
}
