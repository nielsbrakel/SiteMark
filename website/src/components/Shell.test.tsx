import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { renderPages } from '../entry-server';
import type { Locale } from '../i18n/locales';
import { createWebsiteTranslator, loadCatalogs, type WebsiteTranslator } from '../i18n/website-t';
import { type PageId, publishedRoutes, type Route, routeTable } from '../routes/routes';
import { Shell } from './Shell';

const translators = new Map<Locale, WebsiteTranslator>();

beforeAll(async () => {
  for (const locale of ['en', 'nl'] as const) {
    translators.set(locale, createWebsiteTranslator(locale, await loadCatalogs(locale)));
  }
});

afterEach(cleanup);

const routeOf = (page: PageId): Route => {
  const found = routeTable().find((r) => r.page === page);
  if (!found) throw new Error(`no route for ${page}`);
  return found;
};

function renderShell(page: PageId, locale: Locale = 'en', routes = routeTable()) {
  const t = translators.get(locale)?.t;
  if (!t) throw new Error(`no translator for ${locale}`);
  return render(
    <Shell route={routeOf(page)} locale={locale} routes={routes} t={t}>
      <h1>Page content</h1>
    </Shell>,
  );
}

const hrefOf = (element: HTMLElement) => element.getAttribute('href');
const linksIn = (element: HTMLElement) =>
  within(element)
    .getAllByRole('link')
    .map((link) => [link.textContent, hrefOf(link)]);

describe('REQ-PAGE-007 every page has a skip link, a header and a footer', () => {
  it('starts with a skip link to the main content', () => {
    const { container } = renderShell('home');
    const skip = screen.getByRole('link', { name: 'Skip to content' });
    expect(container.querySelector('a')).toBe(skip);
    expect(hrefOf(skip)).toBe('#main');
    const main = screen.getByRole('main');
    expect(main.id).toBe('main');
    expect(within(main).getByRole('heading', { level: 1 }).textContent).toBe('Page content');
  });

  it('links the wordmark to the home page of the current language', () => {
    renderShell('privacy', 'nl');
    const banner = screen.getByRole('banner');
    const home = within(banner).getByRole('link', { name: 'SiteMark-startpagina' });
    expect(hrefOf(home)).toBe('/SiteMark/nl/');
    expect(within(home).getAllByRole('img').length).toBeGreaterThan(0);
  });

  it('shows Help, Playground, Support and Privacy and marks the current page', () => {
    renderShell('support');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(linksIn(nav)).toEqual([
      ['Help', '/SiteMark/help/'],
      ['Playground', '/SiteMark/playground/'],
      ['Support', '/SiteMark/support/'],
      ['Privacy', '/SiteMark/privacy/'],
    ]);
    const current = within(nav)
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page');
    expect(current.map((link) => link.textContent)).toEqual(['Support']);
  });

  it('links only the routes it is given, so unfinished pages stay hidden', () => {
    renderShell('home', 'nl', publishedRoutes('W1'));
    const nav = screen.getByRole('navigation', { name: 'Hoofdmenu' });
    expect(linksIn(nav)).toEqual([
      ['Ondersteuning', '/SiteMark/nl/support/'],
      ['Privacy', '/SiteMark/nl/privacy/'],
    ]);
    const home = within(screen.getByRole('banner')).getByRole('link', {
      name: 'SiteMark-startpagina',
    });
    expect(home.getAttribute('aria-current')).toBe('page');
  });

  it('has a footer with the repository, changelog, privacy, support, sitemap and license', () => {
    renderShell('home');
    const footer = screen.getByRole('contentinfo');
    expect(linksIn(footer)).toEqual([
      ['GitHub', 'https://github.com/nielsbrakel/SiteMark'],
      ['Changelog', '/SiteMark/changelog/'],
      ['Privacy', '/SiteMark/privacy/'],
      ['Support', '/SiteMark/support/'],
      ['Sitemap', '/SiteMark/sitemap.xml'],
      ['MIT license', 'https://github.com/nielsbrakel/SiteMark/blob/main/LICENSE'],
    ]);
    expect(footer.textContent).toContain('Made by Niels Brakel in the Netherlands.');
  });

  it('leaves unfinished pages out of the footer too', () => {
    renderShell('home', 'en', publishedRoutes('W1'));
    const names = linksIn(screen.getByRole('contentinfo')).map(([name]) => name);
    expect(names).not.toContain('Changelog');
  });

  it('wraps every prerendered page in the shell', async () => {
    const pages = await renderPages({ script: 'assets/entry-client.js', styles: [] });
    expect(pages.length).toBeGreaterThan(0);
    for (const { html } of pages) {
      expect(html).toMatch(/<a [^>]*href="#main"/);
      expect(html).toContain('<main id="main"');
      expect(html).toContain('<header');
      expect(html).toContain('<footer');
    }
  });
});

describe('REQ-WEBUX-004 the language switch links to the same page in the other language', () => {
  it('links the Dutch version of the current page and marks English as current', () => {
    renderShell('privacy', 'en');
    const switcher = screen.getByRole('navigation', { name: 'Language' });
    const nl = within(switcher).getByRole('link', { name: 'Nederlands' });
    expect(hrefOf(nl)).toBe('/SiteMark/nl/privacy/');
    expect(nl.getAttribute('hreflang')).toBe('nl');
    expect(nl.getAttribute('lang')).toBe('nl');
    expect(nl.textContent).toContain('NL');
    expect(nl.getAttribute('aria-current')).toBeNull();
    const en = within(switcher).getByRole('link', { name: 'English' });
    expect(en.getAttribute('aria-current')).toBe('page');
  });

  it('links the English version from a Dutch page', () => {
    renderShell('support', 'nl');
    const switcher = screen.getByRole('navigation', { name: 'Taal' });
    const en = within(switcher).getByRole('link', { name: 'English' });
    expect(hrefOf(en)).toBe('/SiteMark/support/');
    expect(en.getAttribute('hreflang')).toBe('en');
    expect(en.getAttribute('lang')).toBe('en');
    expect(
      within(switcher).getByRole('link', { name: 'Nederlands' }).getAttribute('aria-current'),
    ).toBe('page');
  });

  it('keeps the home page when switching', () => {
    renderShell('home', 'nl');
    const switcher = screen.getByRole('navigation', { name: 'Taal' });
    expect(hrefOf(within(switcher).getByRole('link', { name: 'English' }))).toBe('/SiteMark/');
  });
});
