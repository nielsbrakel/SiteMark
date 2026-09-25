import { describe, expect, it } from 'vitest';
import { renderSitemap } from '../entry-server';
import { websiteLocales } from '../i18n/locales';
import { renderedRoutes } from '../pages/registry';
import { sitemapEntries, sitemapXml } from './sitemap';

const ORIGIN = 'https://nielsbrakel.github.io/SiteMark/';

describe('REQ-SEO-003 sitemap.xml lists every route with its language alternates', () => {
  it('has one entry per route and locale, each with en, nl and x-default alternates', () => {
    const entries = sitemapEntries([{ slug: '' }, { slug: 'privacy/' }]);
    expect(entries.map((entry) => entry.loc)).toEqual([
      ORIGIN,
      `${ORIGIN}nl/`,
      `${ORIGIN}privacy/`,
      `${ORIGIN}nl/privacy/`,
    ]);
    expect(entries[3]?.alternates).toEqual([
      { hreflang: 'en', href: `${ORIGIN}privacy/` },
      { hreflang: 'nl', href: `${ORIGIN}nl/privacy/` },
      { hreflang: 'x-default', href: `${ORIGIN}privacy/` },
    ]);
  });

  it('writes the sitemap protocol with xhtml:link alternates', () => {
    const xml = sitemapXml(sitemapEntries([{ slug: 'support/' }]));
    expect(xml).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
        '<url><loc>https://nielsbrakel.github.io/SiteMark/support/</loc>' +
          '<xhtml:link rel="alternate" hreflang="en" href="https://nielsbrakel.github.io/SiteMark/support/"/>' +
          '<xhtml:link rel="alternate" hreflang="nl" href="https://nielsbrakel.github.io/SiteMark/nl/support/"/>' +
          '<xhtml:link rel="alternate" hreflang="x-default" href="https://nielsbrakel.github.io/SiteMark/support/"/></url>',
        '<url><loc>https://nielsbrakel.github.io/SiteMark/nl/support/</loc>' +
          '<xhtml:link rel="alternate" hreflang="en" href="https://nielsbrakel.github.io/SiteMark/support/"/>' +
          '<xhtml:link rel="alternate" hreflang="nl" href="https://nielsbrakel.github.io/SiteMark/nl/support/"/>' +
          '<xhtml:link rel="alternate" hreflang="x-default" href="https://nielsbrakel.github.io/SiteMark/support/"/></url>',
        '</urlset>',
        '',
      ].join('\n'),
    );
  });

  it('escapes XML special characters', () => {
    const xml = sitemapXml([{ loc: 'https://x.test/?a=1&b=<2>', alternates: [] }]);
    expect(xml).toContain('<loc>https://x.test/?a=1&amp;b=&lt;2&gt;</loc>');
  });

  it('lists every rendered route in every locale', () => {
    const xml = renderSitemap();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    expect(locs).toHaveLength(renderedRoutes().length * websiteLocales().length);
    expect(locs).toContain(ORIGIN);
    expect(locs).toContain(`${ORIGIN}nl/`);
  });
});
