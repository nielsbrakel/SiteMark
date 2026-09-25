import { notImplemented } from '@/core/not-implemented';
import type { Route } from '../routes/routes';
import type { Alternate } from '../routes/urls';

/** One `<url>` of the sitemap: a route in one locale with its language alternates. */
export type SitemapEntry = { loc: string; alternates: readonly Alternate[] };

/** Every route in every locale (REQ-SEO-003). */
export function sitemapEntries(_routes: readonly Pick<Route, 'slug'>[]): SitemapEntry[] {
  return notImplemented();
}

/** The sitemap.xml text, with `xhtml:link` language alternates. */
export function sitemapXml(_entries: readonly SitemapEntry[]): string {
  return notImplemented();
}
