import { beforeAll, describe, expect, it } from 'vitest';
import {
  langOf,
  metaContent,
  prerenderedPages,
  tags,
  titleOf,
} from '../../tests/unit/rendered-pages';
import type { RenderedPage } from '../entry-server';
import { routeTable } from '../routes/routes';
import { seoHead } from './seo';

const ORIGIN = 'https://nielsbrakel.github.io/SiteMark/';
const text = {
  title: 'Privacy · SiteMark',
  description: 'How SiteMark handles data.',
  imageAlt: 'Logo',
};
const route = (page: string) => {
  const found = routeTable().find((r) => r.page === page);
  if (!found) throw new Error(`no route for ${page}`);
  return found;
};

let pages: RenderedPage[];
beforeAll(async () => {
  pages = await prerenderedPages();
});

const localeOf = (page: RenderedPage) => (page.file.startsWith('nl/') ? 'nl' : 'en');
const inLocale = (locale: string) => pages.filter((page) => localeOf(page) === locale);

describe('REQ-SEO-001 every route has a unique title and description within limits, and one h1', () => {
  it('takes the title and description from the page text', () => {
    const head = seoHead(route('privacy'), 'en', text);
    expect(head.title).toBe('Privacy · SiteMark');
    expect(head.description).toBe('How SiteMark handles data.');
  });

  it.each(['en', 'nl'])('%s: titles ≤ 60 and descriptions ≤ 160 characters', (locale) => {
    expect(inLocale(locale).length).toBeGreaterThan(0);
    for (const { file, html } of inLocale(locale)) {
      const title = titleOf(html) ?? '';
      const description = metaContent(html, 'description') ?? '';
      expect(title.length, file).toBeGreaterThan(0);
      expect(title.length, file).toBeLessThanOrEqual(60);
      expect(description.length, file).toBeGreaterThan(0);
      expect(description.length, file).toBeLessThanOrEqual(160);
    }
  });

  it.each(['en', 'nl'])('%s: no two routes share a title or a description', (locale) => {
    const titles = inLocale(locale).map(({ html }) => titleOf(html));
    const descriptions = inLocale(locale).map(({ html }) => metaContent(html, 'description'));
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it('gives every route exactly one h1', () => {
    for (const { file, html } of pages) expect(tags(html, 'h1'), file).toHaveLength(1);
  });
});

describe('REQ-SEO-002 every route has a canonical URL, hreflang alternates and <html lang>', () => {
  it('builds an absolute canonical URL with a trailing slash and the alternates', () => {
    const head = seoHead(route('privacy'), 'nl', text);
    expect(head.canonical).toBe(`${ORIGIN}nl/privacy/`);
    expect(head.alternates).toEqual([
      { hreflang: 'en', href: `${ORIGIN}privacy/` },
      { hreflang: 'nl', href: `${ORIGIN}nl/privacy/` },
      { hreflang: 'x-default', href: `${ORIGIN}privacy/` },
    ]);
  });

  it('puts them in every prerendered page', () => {
    for (const { file, html } of pages) {
      const locale = localeOf({ file, html });
      const path = file.replace(/index\.html$/, '');
      expect(langOf(html), file).toBe(locale);
      const links = tags(html, 'link');
      expect(
        links.filter((link) => link.rel === 'canonical'),
        file,
      ).toEqual([{ rel: 'canonical', href: `${ORIGIN}${path}` }]);
      const alternates = links.filter((link) => link.rel === 'alternate');
      expect(alternates.map((link) => link.hreflang).sort(), file).toEqual([
        'en',
        'nl',
        'x-default',
      ]);
      for (const link of alternates) expect(link.href, file).toMatch(/^https:\/\/.+\/$/);
    }
  });
});

describe('REQ-SEO-004 every route has Open Graph and Twitter card tags', () => {
  it('describes the page, its locale and the 1280 × 640 social preview', () => {
    const head = seoHead(route('privacy'), 'nl', text);
    const og = Object.fromEntries(head.openGraph.map(({ key, content }) => [key, content]));
    expect(og).toEqual({
      'og:type': 'website',
      'og:site_name': 'SiteMark',
      'og:title': 'Privacy · SiteMark',
      'og:description': 'How SiteMark handles data.',
      'og:url': `${ORIGIN}nl/privacy/`,
      'og:locale': 'nl_NL',
      'og:locale:alternate': 'en_US',
      'og:image': `${ORIGIN}social-preview.png`,
      'og:image:width': '1280',
      'og:image:height': '640',
      'og:image:alt': 'Logo',
    });
    const twitter = Object.fromEntries(head.twitter.map(({ key, content }) => [key, content]));
    expect(twitter).toEqual({
      'twitter:card': 'summary_large_image',
      'twitter:title': 'Privacy · SiteMark',
      'twitter:description': 'How SiteMark handles data.',
      'twitter:image': `${ORIGIN}social-preview.png`,
      'twitter:image:alt': 'Logo',
    });
  });

  it('uses en_US for English', () => {
    const og = seoHead(route('home'), 'en', text).openGraph;
    expect(og.find(({ key }) => key === 'og:locale')?.content).toBe('en_US');
  });

  it('puts them in every prerendered page', () => {
    for (const { file, html } of pages) {
      expect(metaContent(html, 'og:title'), file).toBe(titleOf(html));
      expect(metaContent(html, 'og:image'), file).toBe(`${ORIGIN}social-preview.png`);
      expect(metaContent(html, 'og:image:alt'), file).toBeTruthy();
      expect(metaContent(html, 'twitter:card'), file).toBe('summary_large_image');
    }
  });
});
