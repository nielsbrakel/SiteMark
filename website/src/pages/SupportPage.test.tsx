import { readFileSync } from 'node:fs';
import { screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { titleOf } from '../../tests/html';
import { pagesForDom, showPage } from '../../tests/unit/page-dom';
import { contactUrls } from '../config/contact';
import type { RenderedPage } from '../entry-server';

let pages: RenderedPage[];

beforeAll(async () => {
  pages = await pagesForDom();
});

afterEach(() => {
  document.body.replaceChildren();
});

/** The absolute URLs of the Markdown links in a repository file, by link text. */
function linksIn(file: string): Map<string, string> {
  const text = readFileSync(file, 'utf8');
  return new Map(
    [...text.matchAll(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g)].map((m) => [m[1] ?? '', m[2] ?? '']),
  );
}

const support = linksIn('.github/SUPPORT.md');
const security = linksIn('SECURITY.md');
const main = () => screen.getByRole('main');
const hrefOf = (name: string) =>
  within(main()).queryByRole('link', { name })?.getAttribute('href') ?? null;

describe('REQ-PAGE-003 the support page offers the same contact routes as the repository', () => {
  it('takes its URLs from .github/SUPPORT.md and SECURITY.md', () => {
    expect(contactUrls()).toEqual({
      bugReport: support.get('bug report'),
      featureRequest: support.get('feature request'),
      securityReport: security.get('GitHub private vulnerability reporting'),
      securityPolicy: 'https://github.com/nielsbrakel/SiteMark/blob/main/SECURITY.md',
    });
  });

  it.each([
    ['support/index.html', 'Report a bug', 'Request a feature', 'Report a vulnerability privately'],
    [
      'nl/support/index.html',
      'Meld een bug',
      'Vraag een functie aan',
      'Meld een kwetsbaarheid privé',
    ],
  ])(
    '%s links the bug form, the feature form and private reporting',
    (file, bug, feature, vuln) => {
      const html = showPage(pages, file);
      expect(html).toContain('data-route="support"');
      expect(hrefOf(bug)).toBe(support.get('bug report'));
      expect(hrefOf(feature)).toBe(support.get('feature request'));
      expect(hrefOf(vuln)).toBe(security.get('GitHub private vulnerability reporting'));
      for (const link of within(main()).getAllByRole('link')) {
        expect(link.getAttribute('rel')).toBe('noopener noreferrer');
      }
    },
  );

  it('warns clearly not to open a public issue for security problems', () => {
    showPage(pages, 'support/index.html');
    const note = within(main()).getByRole('note');
    expect(note.textContent).toContain("Security problem? Don't open a public issue.");
    const policy = within(note).getByRole('link', { name: 'Read the security policy' });
    expect(policy.getAttribute('href')).toBe(
      'https://github.com/nielsbrakel/SiteMark/blob/main/SECURITY.md',
    );
  });

  it.each([
    ['support/index.html', 'Support', 'Frequently asked questions'],
    ['nl/support/index.html', 'Ondersteuning', 'Veelgestelde vragen'],
  ])('%s answers the six common questions', (file, h1, faq) => {
    showPage(pages, file);
    expect(within(main()).getByRole('heading', { level: 1 }).textContent).toBe(h1);
    const headings = within(main()).getAllByRole('heading');
    const at = headings.findIndex((heading) => heading.textContent === faq);
    expect(at).toBeGreaterThan(0);
    const questions = headings.slice(at + 1).filter((heading) => heading.tagName === 'H3');
    expect(questions).toHaveLength(6);
    for (const question of questions) {
      expect(question.textContent).toMatch(/\?$/);
      expect(question.nextElementSibling?.textContent?.length).toBeGreaterThan(40);
    }
  });

  it('covers restricted pages, the permission prompt, missing marks, hiding, data and removal', () => {
    showPage(pages, 'support/index.html');
    const questions = within(main())
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent ?? '');
    for (const topic of [
      /some pages/,
      /permission/,
      /marks don't show/,
      /hide/,
      /stored/,
      /remove/,
    ]) {
      expect(
        questions.some((question) => topic.test(question)),
        String(topic),
      ).toBe(true);
    }
  });

  it('lists what to include in a bug report', () => {
    showPage(pages, 'support/index.html');
    const heading = within(main()).getByRole('heading', {
      name: 'What to include in a bug report',
    });
    const list = heading.nextElementSibling as HTMLElement;
    const items = within(list)
      .getAllByRole('listitem')
      .map((item) => item.textContent ?? '');
    expect(items.some((item) => /browser and its version/.test(item))).toBe(true);
    expect(items.some((item) => /SiteMark version/.test(item))).toBe(true);
    expect(items.some((item) => /Copy diagnostics/.test(item))).toBe(true);
  });

  it('sets expectations: spare time, answers can take a few days', () => {
    showPage(pages, 'support/index.html');
    expect(main().textContent).toContain('spare time');
    showPage(pages, 'nl/support/index.html');
    expect(main().textContent).toContain('vrije tijd');
  });

  it('has its own title and marks Support as the current page', () => {
    const html = showPage(pages, 'nl/support/index.html');
    expect(titleOf(html)).toBe('Ondersteuning en contact · SiteMark');
    const nav = screen.getByRole('navigation', { name: 'Hoofdmenu' });
    const current = within(nav)
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page');
    expect(current.map((link) => link.textContent)).toEqual(['Ondersteuning']);
  });
});
