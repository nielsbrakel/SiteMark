import { cleanup, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { titleOf } from '../../tests/html';
import { pagesForDom, showPage } from '../../tests/unit/page-dom';
import { helpTopicsFor } from '../content/help';
import type { RenderedPage } from '../entry-server';
import type { Locale } from '../i18n/locales';
import { HELP_GROUPS, HELP_PROBLEMS } from './help-groups';

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
  'site-groups',
  'url-patterns',
  'marks-and-effects',
  'picking-an-element',
  'hiding-marks-and-shortcuts',
  'settings-and-appearance',
  'import-and-export',
  'permissions',
  'troubleshooting',
] as const;

const main = () => screen.getByRole('main');
const prefix = (locale: Locale) => (locale === 'en' ? '/SiteMark/' : '/SiteMark/nl/');

describe('REQ-PAGE-004 the help index lists every topic', () => {
  it.each([
    ['en', 'help/index.html', 'Help and support'],
    ['nl', 'nl/help/index.html', 'Help en ondersteuning'],
  ] as const)(
    '%s: a heading, quick links, then every topic in its group with its description',
    (locale, file, h1) => {
      showPage(pages, file);
      expect(within(main()).queryByRole('heading', { level: 1 })?.textContent).toBe(h1);
      const topics = helpTopicsFor(locale);
      const links = [...main().querySelectorAll('li > a + p')].map(
        (entry) => entry.previousElementSibling as HTMLElement,
      );
      expect(links.map((link) => link.getAttribute('href'))).toEqual(
        TOPICS.map((topic) => `${prefix(locale)}help/${topic}/`),
      );
      expect(links.map((link) => link.textContent)).toEqual(topics.map((topic) => topic.title));
      for (const topic of topics) expect(main().textContent).toContain(topic.description);
    },
  );

  it('puts every topic in exactly one group', () => {
    expect(HELP_GROUPS.flatMap((group) => group.topics)).toEqual([...TOPICS]);
  });

  it.each([
    ['en', 'help/index.html', "My marks don't show", 'troubleshooting'],
    ['nl', 'nl/help/index.html', 'Mijn markeringen verschijnen niet', 'troubleshooting'],
  ] as const)(
    '%s: quick links lead to the topic that answers a common problem',
    (locale, file, name, topic) => {
      showPage(pages, file);
      expect(within(main()).getByRole('link', { name }).getAttribute('href')).toBe(
        `${prefix(locale)}help/${topic}/`,
      );
      expect(HELP_PROBLEMS.map((problem) => problem.topic).every((t) => TOPICS.includes(t))).toBe(
        true,
      );
    },
  );

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
