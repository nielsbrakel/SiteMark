import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { pagesForDom, showPage } from '../../tests/unit/page-dom';
import { changelogReleases, changelogSource } from '../content/changelog';
import type { RenderedPage } from '../entry-server';
import { createWebsiteTranslator, loadCatalogs, type WebsiteTranslator } from '../i18n/website-t';
import { Changelog } from './ChangelogPage';

let pages: RenderedPage[];
let en: WebsiteTranslator;
let nl: WebsiteTranslator;

beforeAll(async () => {
  pages = await pagesForDom();
  en = createWebsiteTranslator('en', await loadCatalogs('en'));
  nl = createWebsiteTranslator('nl', await loadCatalogs('nl'));
});

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

/** A CHANGELOG.md as Changesets writes it. */
const CHANGESETS = `# sitemark

## 1.0.0

### Major Changes

- 1a2b3c4: The first release for Chrome, Edge and Firefox.

## 0.9.0

### Minor Changes

- 5d6e7f8: Marks follow single-page navigation.
`;

describe('REQ-PAGE-005 the changelog page renders CHANGELOG.md', () => {
  it('lists every release heading, without the package heading', () => {
    expect(changelogReleases(CHANGESETS)).toEqual(['1.0.0', '0.9.0']);
    render(<Changelog source={CHANGESETS} t={en.t} locale="en" />);
    expect(screen.queryAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      '1.0.0',
      '0.9.0',
    ]);
    expect(screen.queryByRole('heading', { name: 'sitemark' })).toBeNull();
    expect(screen.getByText(/The first release for Chrome/)).toBeTruthy();
  });

  it.each([
    ['en', 'No releases yet. The first one is on its way.'],
    ['nl', 'Nog geen releases. De eerste komt eraan.'],
  ] as const)('says so when there is no release yet (%s)', (locale, text) => {
    const t = locale === 'en' ? en.t : nl.t;
    expect(changelogReleases(undefined)).toEqual([]);
    render(<Changelog source={undefined} t={t} locale={locale} />);
    expect(screen.queryByText(text)).not.toBeNull();
    expect(screen.queryAllByRole('heading', { level: 2 })).toEqual([]);
  });

  it('shows the English text on the Dutch page, marked as English, with a Dutch notice', () => {
    render(<Changelog source={CHANGESETS} t={nl.t} locale="nl" />);
    expect(
      screen.queryByText('De wijzigingen worden alleen in het Engels bijgehouden.'),
    ).not.toBeNull();
    const release = screen.queryByRole('heading', { level: 2, name: '1.0.0' });
    expect(release?.closest('[lang]')?.getAttribute('lang')).toBe('en');
  });

  it('has no notice on the English page', () => {
    render(<Changelog source={CHANGESETS} t={en.t} locale="en" />);
    expect(screen.queryByText(/alleen in het Engels/)).toBeNull();
    expect(document.querySelector('[lang]')).toBeNull();
  });

  it.each([
    ['changelog/index.html', 'Changelog'],
    ['nl/changelog/index.html', 'Wijzigingen'],
  ])('%s is prerendered from the repository CHANGELOG.md, linked in the footer', (file, h1) => {
    showPage(pages, file);
    const main = screen.getByRole('main');
    expect(within(main).queryByRole('heading', { level: 1 })?.textContent).toBe(h1);
    expect(within(main).queryAllByRole('heading', { level: 2 })).toHaveLength(
      changelogReleases(changelogSource()).length,
    );
    const footer = screen.getByRole('contentinfo');
    const link = within(footer).queryByRole('link', { name: h1 });
    expect(link?.getAttribute('href')).toBe(`/SiteMark/${file.replace('index.html', '')}`);
  });
});
