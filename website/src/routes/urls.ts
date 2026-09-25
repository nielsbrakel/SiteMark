import { notImplemented } from '@/core/not-implemented';
import type { Locale } from '../i18n/locales';
import type { Route } from './routes';

export type Alternate = { hreflang: Locale | 'x-default'; href: string };

type Slugged = Pick<Route, 'slug'>;

/** `/SiteMark/<locale prefix><slug>`: English at the base path, Dutch under `nl/` (D-255). */
export function routePath(_route: Slugged, _locale: Locale): string {
  return notImplemented();
}

/** The absolute URL on the GitHub Pages origin (D-244). */
export function canonicalUrl(_route: Slugged, _locale: Locale): string {
  return notImplemented();
}

/** hreflang links for every locale, plus x-default → English. */
export function alternates(_route: Slugged): Alternate[] {
  return notImplemented();
}

/** Where the prerender step writes the page, relative to the client output directory. */
export function outputFile(_route: Slugged, _locale: Locale): string {
  return notImplemented();
}

/** A built asset or public file, under the base path. */
export function assetUrl(_file: string): string {
  return notImplemented();
}
