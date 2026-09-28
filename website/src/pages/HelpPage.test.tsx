import { cleanup, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { titleOf } from '../../tests/html';
import { pagesForDom, showPage } from '../../tests/unit/page-dom';
import { helpTopicsFor } from '../content/help';
import type { RenderedPage } from '../entry-server';
import type { Locale } from '../i18n/locales';

let pages: RenderedPage[];

beforeAll(async () => {
  pages = await pagesForDom();
});

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

const TOPICS = [
  'getting-started',
  'url-patterns',
  'marks-and-effects',
  'picking-an-element',
  'hiding-marks-and-shortcuts',
  'permissions',
  'import-and-export',
  'troubleshooting',
] as const;

const main = () => screen.getByRole('main');
const prefix = (locale: Locale) => (locale === 'en' ? '/SiteMark/' : '/SiteMark/nl/');

describe('REQ-PAGE-004 the help index lists every topic', () => {
  it.each([
    ['index', 'en', 'help/index.html', 'Help'],
    ['index', 'nl', 'nl/help/index.html', 'Help'],
  ] as const)('%s (%s): a heading and the topics in their order', (_page, locale, file, h1) => {
    showPage(pages, file);
    expect(within(main()).queryByRole('heading', { level: 1 })?.textContent).toBe(h1);
    const links = within(main()).queryAllByRole('link');
    const topics = helpTopicsFor(locale);
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      TOPICS.map((topic) => `${prefix(locale)}help/${topic}/`),
    );
    expect(links.map((link) => link.textContent)).toEqual(topics.map((topic) => topic.title));
    for (const topic of topics) expect(main().textContent).toContain(topic.description);
  });

  it('shows Help in the main navigation', () => {
    showPage(pages, 'index.html');
    const nav = screen.queryByRole('navigation', { name: 'Main' });
    expect(nav && within(nav).queryByRole('link', { name: 'Help' })?.getAttribute('href')).toBe(
      '/SiteMark/help/',
    );
  });
});

describe('REQ-PAGE-004 every help topic has its own page in both languages', () => {
  const cases = (['en', 'nl'] as const).flatMap((locale) =>
    TOPICS.map((topic) => ({ locale, topic })),
  );

  it.each(cases)('$topic ($locale): the title as h1, then the Markdown', ({ locale, topic }) => {
    const file = `${locale === 'en' ? '' : 'nl/'}help/${topic}/index.html`;
    const html = showPage(pages, file);
    const content = helpTopicsFor(locale).find((entry) => entry.topic === topic);
    expect(within(main()).queryByRole('heading', { level: 1 })?.textContent).toBe(content?.title);
    expect(main().querySelectorAll('h1')).toHaveLength(1);
    expect(titleOf(html)).toBe(
      `${content?.title} · ${locale === 'en' ? 'SiteMark help' : 'Help bij SiteMark'}`,
    );
    expect(main().textContent?.length).toBeGreaterThan((content?.title.length ?? 0) + 40);
  });

  it('lists every topic next to the text and marks the current one', () => {
    showPage(pages, 'help/url-patterns/index.html');
    const topics = screen.queryByRole('navigation', { name: 'Help topics' });
    expect(topics).not.toBeNull();
    const links = within(topics ?? document.body).queryAllByRole('link');
    expect(links).toHaveLength(TOPICS.length + 1);
    expect(links[0]?.getAttribute('href')).toBe('/SiteMark/help/');
    const current = links.filter((link) => link.getAttribute('aria-current') === 'page');
    expect(current.map((link) => link.getAttribute('href'))).toEqual([
      '/SiteMark/help/url-patterns/',
    ]);
  });

  it('keeps Help current in the main navigation on a topic page', () => {
    showPage(pages, 'nl/help/permissions/index.html');
    const nav = screen.queryByRole('navigation', { name: 'Hoofdmenu' });
    const help = nav && within(nav).queryByRole('link', { name: 'Help' });
    expect(help?.getAttribute('aria-current')).toBe('page');
  });
});
