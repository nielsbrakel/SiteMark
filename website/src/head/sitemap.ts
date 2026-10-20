import { websiteLocales } from '../i18n/locales';
import type { Route } from '../routes/routes';
import { type Alternate, alternates, canonicalUrl } from '../routes/urls';

/** One `<url>` of the sitemap: a route in one locale with its language alternates. */
export type SitemapEntry = {
  loc: string;
  alternates: readonly Alternate[];
  /** `YYYY-MM-DD`: when the website was last built from a change. */
  lastmod?: string;
};

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

const escapeXml = (text: string) => text.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);

/** Every route in every locale (REQ-SEO-003). */
export function sitemapEntries(
  routes: readonly Pick<Route, 'slug'>[],
  lastmod?: string,
): SitemapEntry[] {
  return routes.flatMap((route) =>
    websiteLocales().map((locale) => ({
      loc: canonicalUrl(route, locale),
      alternates: alternates(route),
      ...(lastmod && { lastmod }),
    })),
  );
}

function urlElement({ loc, alternates: links, lastmod }: SitemapEntry): string {
  const alternateLinks = links.map(
    ({ hreflang, href }) =>
      `<xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}"/>`,
  );
  const modified = lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : '';
  return `<url><loc>${escapeXml(loc)}</loc>${modified}${alternateLinks.join('')}</url>`;
}

/** The sitemap.xml text (sitemaps.org protocol), with `xhtml:link` language alternates. */
export function sitemapXml(entries: readonly SitemapEntry[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries.map(urlElement),
    '</urlset>',
    '',
  ].join('\n');
}
