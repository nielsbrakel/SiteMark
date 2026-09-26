import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cspOf, langOf, metaContent, scriptsOf, tags, titleOf } from '../../tests/html';
import { renderNotFound } from '../entry-server';
import { createWebsiteTranslator, loadCatalogs, type WebsiteTranslator } from '../i18n/website-t';
import { publishedRoutes, routeTable } from '../routes/routes';
import { NotFoundPage } from './NotFoundPage';

let en: WebsiteTranslator;
let nl: WebsiteTranslator;

beforeAll(async () => {
  en = createWebsiteTranslator('en', await loadCatalogs('en'));
  nl = createWebsiteTranslator('nl', await loadCatalogs('nl'));
});

afterEach(cleanup);

const linksOf = (element: HTMLElement) =>
  within(element)
    .getAllByRole('link')
    .map((link) => [link.textContent, link.getAttribute('href')]);

const sectionIn = (lang: string) =>
  document.querySelector<HTMLElement>(`main section[lang="${lang}"]`) as HTMLElement;

describe('REQ-PAGE-006 a bilingual 404.html links to home, help and support', () => {
  it('says "not found" in English and in Dutch, each marked with its language', () => {
    render(<NotFoundPage en={en.t} nl={nl.t} routes={publishedRoutes('W1')} />);
    const english = sectionIn('en');
    const dutch = sectionIn('nl');
    expect(within(english).getByRole('heading', { level: 1 }).textContent).toBe('Page not found');
    expect(within(dutch).getByRole('heading', { level: 2 }).textContent).toBe(
      'Pagina niet gevonden',
    );
    expect(linksOf(english)).toEqual([
      ['Home', '/SiteMark/'],
      ['Support', '/SiteMark/support/'],
    ]);
    expect(linksOf(dutch)).toEqual([
      ['Home', '/SiteMark/nl/'],
      ['Ondersteuning', '/SiteMark/nl/support/'],
    ]);
  });

  it('links help once the help pages exist (W2)', () => {
    render(<NotFoundPage en={en.t} nl={nl.t} routes={routeTable()} />);
    expect(linksOf(sectionIn('en')).map(([name]) => name)).toEqual(['Home', 'Help', 'Support']);
    expect(
      screen.getAllByRole('link', { name: 'Help' }).map((l) => l.getAttribute('href')),
    ).toEqual(['/SiteMark/help/', '/SiteMark/nl/help/']);
  });

  it('is prerendered as 404.html: bilingual title, not indexed, no JavaScript', async () => {
    const page = await renderNotFound({ script: 'assets/entry-client.js', styles: [] });
    expect(page.file).toBe('404.html');
    expect(page.html).toMatch(/^<!doctype html>/i);
    expect(langOf(page.html)).toBe('en');
    expect(titleOf(page.html)).toBe('Page not found · Pagina niet gevonden · SiteMark');
    expect(metaContent(page.html, 'robots')).toBe('noindex');
    expect(tags(page.html, 'link').filter((link) => link.rel === 'canonical')).toEqual([]);
    expect(cspOf(page.html)).toMatch(/^default-src 'none'; script-src 'self' 'sha256-/);
    expect(scriptsOf(page.html).filter(({ attributes }) => attributes.src)).toEqual([]);
    expect(page.html).toContain('<section lang="nl"');
  });
});
