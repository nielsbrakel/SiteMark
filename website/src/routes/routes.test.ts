import { describe, expect, it } from 'vitest';
import { websiteLocales } from '../i18n/locales';
import { currentMilestone, navRoutes, publishedRoutes, type Route, routeTable } from './routes';
import { alternates, assetUrl, canonicalUrl, outputFile, routePath } from './urls';

const route = (page: Route['page']): Route => {
  const found = routeTable().find((r) => r.page === page);
  if (!found) throw new Error(`no route for ${page}`);
  return found;
};
const pages = (routes: readonly Route[]) => routes.map((r) => r.page);

describe('REQ-WEB-001 every internal URL carries the base path /SiteMark/', () => {
  it('builds paths with the base path and a trailing slash', () => {
    expect(routePath(route('home'), 'en')).toBe('/SiteMark/');
    expect(routePath(route('privacy'), 'en')).toBe('/SiteMark/privacy/');
    expect(routePath(route('help'), 'en')).toBe('/SiteMark/help/');
    for (const r of routeTable()) {
      for (const locale of websiteLocales()) {
        expect(routePath(r, locale)).toMatch(/^\/SiteMark\/([a-z]+\/)*$/);
      }
    }
  });

  it('builds absolute canonical URLs on the GitHub Pages origin', () => {
    expect(canonicalUrl(route('home'), 'en')).toBe('https://nielsbrakel.github.io/SiteMark/');
    expect(canonicalUrl(route('support'), 'nl')).toBe(
      'https://nielsbrakel.github.io/SiteMark/nl/support/',
    );
  });

  it('puts assets under the base path', () => {
    expect(assetUrl('assets/entry-client-abc.js')).toBe('/SiteMark/assets/entry-client-abc.js');
    expect(assetUrl('/social-preview.png')).toBe('/SiteMark/social-preview.png');
  });

  it('writes each route to <locale prefix><slug>/index.html', () => {
    expect(outputFile(route('home'), 'en')).toBe('index.html');
    expect(outputFile(route('home'), 'nl')).toBe('nl/index.html');
    expect(outputFile(route('privacy'), 'nl')).toBe('nl/privacy/index.html');
  });

  it('gives every page one unique slug', () => {
    const slugs = routeTable().map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(pages(routeTable()).sort()).toEqual(
      ['changelog', 'help', 'home', 'playground', 'privacy', 'support'].sort(),
    );
  });
});

describe('REQ-WEBUX-004 English lives at the base path and Dutch under /nl/, with the same slugs', () => {
  it('supports English and Dutch', () => {
    expect(websiteLocales()).toEqual(['en', 'nl']);
  });

  it('uses the same slug in both languages', () => {
    for (const r of routeTable()) {
      const en = routePath(r, 'en');
      expect(routePath(r, 'nl')).toBe(en.replace(/^\/SiteMark\//, '/SiteMark/nl/'));
    }
  });

  it('links the language alternates, with x-default pointing to English', () => {
    expect(alternates(route('privacy'))).toEqual([
      { hreflang: 'en', href: 'https://nielsbrakel.github.io/SiteMark/privacy/' },
      { hreflang: 'nl', href: 'https://nielsbrakel.github.io/SiteMark/nl/privacy/' },
      { hreflang: 'x-default', href: 'https://nielsbrakel.github.io/SiteMark/privacy/' },
    ]);
  });
});

describe('REQ-PAGE-007 the route table hides pages of unfinished milestones', () => {
  it('publishes the W1 pages now', () => {
    expect(currentMilestone()).toBe('W1');
    expect(pages(publishedRoutes('W1'))).toEqual(['home', 'support', 'privacy']);
    expect(pages(publishedRoutes('W2'))).toEqual(pages(routeTable()));
  });

  it('shows Help, Playground, Support and Privacy in the navigation once they exist', () => {
    expect(pages(navRoutes('W1'))).toEqual(['support', 'privacy']);
    expect(pages(navRoutes('W2'))).toEqual(['help', 'playground', 'support', 'privacy']);
  });
});

describe('REQ-POLICY-005 the privacy and support URLs never move', () => {
  it.each([
    ['privacy', 'en', '/SiteMark/privacy/'],
    ['privacy', 'nl', '/SiteMark/nl/privacy/'],
    ['support', 'en', '/SiteMark/support/'],
    ['support', 'nl', '/SiteMark/nl/support/'],
  ] as const)('%s (%s) → %s', (page, locale, path) => {
    expect(routePath(route(page), locale)).toBe(path);
    expect(route(page).stable).toBe(true);
    expect(pages(publishedRoutes('W1'))).toContain(page);
  });

  it('pins only those pages', () => {
    expect(pages(routeTable().filter((r) => r.stable))).toEqual(['support', 'privacy']);
  });
});
