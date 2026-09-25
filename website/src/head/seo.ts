import { notImplemented } from '@/core/not-implemented';
import type { Locale } from '../i18n/locales';
import type { Route } from '../routes/routes';
import type { Alternate } from '../routes/urls';

/** A page's translated texts for its head. */
export type PageText = { title: string; description: string; imageAlt: string };

/** `<meta property>` (Open Graph) or `<meta name>` (Twitter) with its content. */
export type MetaTag = { key: string; content: string };

/** Everything search engines and link previews read from one route (REQ-SEO-001…004). */
export type SeoHead = {
  title: string;
  description: string;
  /** Absolute, with a trailing slash (REQ-SEO-002). */
  canonical: string;
  alternates: readonly Alternate[];
  /** `<meta property="og:…">`. */
  openGraph: readonly MetaTag[];
  /** `<meta name="twitter:…">`. */
  twitter: readonly MetaTag[];
};

/** The head data of one route in one locale. Pure: no HTML, the Document renders it. */
export function seoHead(_route: Pick<Route, 'slug'>, _locale: Locale, _text: PageText): SeoHead {
  return notImplemented();
}
