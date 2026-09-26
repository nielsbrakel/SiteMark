import type { Locale } from '../i18n/locales';
import type { WebsiteTranslator } from '../i18n/website-t';

/** What every page component gets when the page is prerendered. */
export type PageProps = {
  t: WebsiteTranslator['t'];
  tp: WebsiteTranslator['tp'];
  /** The route's language, for content that isn't in the catalogs (such as the privacy policy). */
  locale: Locale;
};
