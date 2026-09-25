import { type Locale, websiteLocales } from '../i18n/locales';
import type { Route } from './routes';

export type Alternate = { hreflang: Locale | 'x-default'; href: string };

type Slugged = Pick<Route, 'slug'>;

/** The GitHub Pages project site (D-244). The base path is case-sensitive. */
const ORIGIN = 'https://nielsbrakel.github.io';
const BASE_PATH = '/SiteMark/';

const prefix = (locale: Locale) => (locale === 'en' ? '' : `${locale}/`);

/** `/SiteMark/<locale prefix><slug>`: English at the base path, Dutch under `nl/` (D-255). */
export function routePath(route: Slugged, locale: Locale): string {
  return `${BASE_PATH}${prefix(locale)}${route.slug}`;
}

/** The absolute URL on the GitHub Pages origin (D-244). */
export function canonicalUrl(route: Slugged, locale: Locale): string {
  return `${ORIGIN}${routePath(route, locale)}`;
}

/** hreflang links for every locale, plus x-default → English. */
export function alternates(route: Slugged): Alternate[] {
  const links: Alternate[] = websiteLocales().map((locale) => ({
    hreflang: locale,
    href: canonicalUrl(route, locale),
  }));
  return [...links, { hreflang: 'x-default', href: canonicalUrl(route, 'en') }];
}

/** Where the prerender step writes the page, relative to the client output directory. */
export function outputFile(route: Slugged, locale: Locale): string {
  return `${prefix(locale)}${route.slug}index.html`;
}

/** A built asset or public file, under the base path. */
export function assetUrl(file: string): string {
  return `${BASE_PATH}${file.replace(/^\/+/, '')}`;
}

/** The absolute URL of a public file, e.g. the social preview image (REQ-SEO-004). */
export function absoluteUrl(file: string): string {
  return `${ORIGIN}${assetUrl(file)}`;
}
