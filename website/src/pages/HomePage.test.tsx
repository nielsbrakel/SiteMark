import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { pagesForDom, showPage } from '../../tests/unit/page-dom';
import { InstallButtons } from '../components/InstallButtons';
import { type Store, stores } from '../config/stores';
import type { RenderedPage } from '../entry-server';
import { createWebsiteTranslator, loadCatalogs, type WebsiteTranslator } from '../i18n/website-t';

let pages: RenderedPage[];
let en: WebsiteTranslator;

beforeAll(async () => {
  pages = await pagesForDom();
  en = createWebsiteTranslator('en', await loadCatalogs('en'));
});

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

const main = () => screen.getByRole('main');
const STORE_HOSTS =
  /chrome\.google\.com|chromewebstore\.google\.com|microsoftedge\.microsoft\.com|addons\.mozilla\.org|apps\.apple\.com/;

describe('REQ-PAGE-001 the home page explains SiteMark in one look', () => {
  it.each([
    [
      'index.html',
      'Never confuse production with test again',
      /^SiteMark is a private browser extension/,
    ],
    [
      'nl/index.html',
      'Verwar productie nooit meer met test',
      /^SiteMark is een privacyvriendelijke browserextensie/,
    ],
  ])('%s leads with the value proposition', (file, h1, lead) => {
    showPage(pages, file);
    const heading = within(main()).getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe(h1);
    expect(heading.nextElementSibling?.textContent).toMatch(lead);
  });

  it.each([
    ['index.html', ['Unmistakable', 'Simple', 'Private']],
    ['nl/index.html', ['Onmiskenbaar', 'Eenvoudig', 'Privé']],
  ])('%s highlights the three goals, each in a card with one sentence', (file, titles) => {
    showPage(pages, file);
    const cards = within(main())
      .queryAllByRole('heading', { level: 3 })
      .slice(0, 3)
      .map((heading) => [heading.textContent, heading.nextElementSibling?.textContent ?? '']);
    expect(cards.map(([title]) => title)).toEqual(titles);
    for (const [, text] of cards) expect(text).toMatch(/^[^.]+\.$|^[^.]+\. [^.]+\.$/);
  });

  it('shows the shop without and with marks next to the value proposition', () => {
    showPage(pages, 'index.html');
    const hero = within(main()).getByRole('heading', { level: 1 }).closest('section');
    expect(hero?.querySelector('[data-layer="before"]')).not.toBeNull();
    expect(hero?.querySelector('[data-layer="after"]')).not.toBeNull();
  });

  it.each([
    ['index.html', 'Read the privacy policy', '/SiteMark/privacy/'],
    ['nl/index.html', 'Lees de privacyverklaring', '/SiteMark/nl/privacy/'],
  ])('%s sums up privacy and links the privacy page', (file, link, href) => {
    showPage(pages, file);
    const privacy = within(main()).queryByRole('link', { name: link });
    expect(privacy?.getAttribute('href')).toBe(href);
    expect(privacy?.closest('section')?.textContent).toMatch(/SiteMark (collects|verzamelt)/);
  });
});

describe('REQ-PAGE-001 the home page privacy section', () => {
  it.each([
    ['index.html', ['Public source', 'Stays in your browser', 'No analytics or requests']],
    ['nl/index.html', ['Openbare broncode', 'Blijft in je browser', 'Geen analytics of verzoeken']],
  ])('%s states the facts and lists every permission', (file, facts) => {
    showPage(pages, file);
    const section = within(main()).getByRole('region', {
      name: /Private by design|Privacy voorop/,
    });
    const titles = within(section).getAllByRole('heading', { level: 3 });
    expect(titles.slice(0, facts.length).map((title) => title.textContent)).toEqual(facts);
    const permissions = [...section.querySelectorAll('dt code')].map((code) => code.textContent);
    expect(permissions).toEqual(['storage', 'scripting', 'activeTab', '*://*/*']);
  });
});

describe('REQ-PAGE-002 install buttons never link to a store that has no listing yet', () => {
  it('links Chrome, Edge and Firefox, and disables Safari (coming in the future)', () => {
    showPage(pages, 'index.html');
    const install = within(main()).queryByRole('list', { name: 'Install SiteMark' });
    expect(install).not.toBeNull();
    const buttons = within(install as HTMLElement).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(['Safari: coming in the future']);
    for (const button of buttons) expect((button as HTMLButtonElement).disabled).toBe(true);
    const links = within(main()).queryAllByRole('link');
    const stores = links.filter((link) => STORE_HOSTS.test(link.getAttribute('href') ?? ''));
    expect(stores.map((link) => link.textContent)).toEqual([
      'Add to Chrome',
      'Add to Edge',
      'Add to Firefox',
    ]);
  });

  it.each([
    ['index.html', 'SiteMark installs on a computer. Open this page there.'],
    ['nl/index.html', 'SiteMark installt op een computer. Open deze pagina daar.'],
  ])('%s tells iPhone visitors to continue on a computer', (file, hint) => {
    showPage(pages, file);
    const install = within(main()).getByRole('list', {
      name: /Install SiteMark|SiteMark installeren/,
    });
    expect(within(install).queryByText(hint)).not.toBeNull();
  });

  it.each([
    ['index.html', 'Also for'],
    ['nl/index.html', 'Ook voor'],
  ])('%s introduces the other stores with a label', (file, label) => {
    showPage(pages, file);
    const install = within(main()).getByRole('list', {
      name: /Install SiteMark|SiteMark installeren/,
    });
    expect(within(install).queryByText(label)).not.toBeNull();
  });

  it("leads with one big button: the visitor's store, Chrome when the browser isn't recognised", () => {
    const file = path.resolve('website/src/components/InstallButtons.module.css');
    const css = existsSync(file) ? readFileSync(file, 'utf8') : '';
    const lead = String.raw`:global\(:root:not\(\[data-browser\]\)\) \.chrome,\s*:global\(:root\[data-browser='edge'\]\) \.edge,\s*:global\(:root\[data-browser='firefox'\]\) \.firefox`;
    expect(css).toMatch(new RegExp(`${lead}\\s*\\{[^}]*flex-basis:\\s*100%`));
    expect(css).toMatch(
      /:global\(:root\[data-browser='safari'\]\) \.safari\s*\{[^}]*flex-basis:\s*100%/,
    );
  });

  it('links a store as soon as its listing URL is configured', () => {
    const chrome = 'https://chrome.google.com/webstore/detail/abcdefghijklmnopabcdefghijklmnop';
    const configured: Store[] = stores().map((store) =>
      store.id === 'chrome' ? { ...store, url: chrome } : store,
    );
    render(<InstallButtons stores={configured} t={en.t} />);
    const link = screen.getByRole('link', { name: 'Add to Chrome' });
    expect(link.getAttribute('href')).toBe(chrome);
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});

describe('REQ-PAGE-009 the home page shows SiteMark at work as three notes with one switch', () => {
  const section = (heading: string) =>
    (within(main()).queryByRole('heading', { level: 2, name: heading })?.closest('section') ??
      main()) as HTMLElement;
  const CASES = [
    ['index.html', 'SiteMark at work', ['The favicon', 'The page', 'The component']],
    ['nl/index.html', 'SiteMark aan het werk', ['Het favicon', 'De pagina', 'Het onderdeel']],
  ] as const;

  it.each(CASES)('%s: a SiteMark switch, off at first, comes before the notes', (file, heading) => {
    showPage(pages, file);
    const scene = section(heading);
    const toggle = within(scene).queryByRole<HTMLInputElement>('switch', { name: 'SiteMark' });
    const notes = within(scene).queryByRole('list');
    expect(toggle?.checked).toBe(false);
    expect(toggle?.compareDocumentPosition(notes ?? scene)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it.each(CASES)(
    '%s: three notes in a row, each with a title and a described image',
    (file, heading, titles) => {
      showPage(pages, file);
      const notes = [...(within(section(heading)).queryByRole('list')?.children ?? [])];
      expect(notes.map((note) => note.querySelector('h3')?.textContent)).toEqual(titles);
      const names = notes.map((note) =>
        note.querySelector('[role="img"]')?.getAttribute('aria-label'),
      );
      for (const name of names) {
        expect(name?.length).toBeGreaterThan(40);
        expect(name).not.toMatch(/screenshot|schermafbeelding/i);
      }
      expect(new Set(names).size).toBe(3);
    },
  );

  it.each(CASES)(
    '%s: the notes are taped cards, and no screenshot tour is left',
    (file, heading) => {
      showPage(pages, file);
      const scene = section(heading);
      const notes = within(scene).queryAllByRole('listitem');
      expect(notes).toHaveLength(3);
      for (const note of notes) {
        expect(note.classList.contains('sm-card')).toBe(true);
        expect(note.classList.contains('sm-tape')).toBe(true);
        expect(note.textContent).not.toMatch(/PRODUCTION|PRODUCTIE/);
      }
      expect(scene.querySelector('picture, figure, img')).toBeNull();
      expect(within(scene).queryByRole('radiogroup')).toBeNull();
    },
  );

  it('uses the English texts on the English page', () => {
    showPage(pages, 'index.html');
    const names = within(section('SiteMark at work'))
      .queryAllByRole('img')
      .map((img) => img.getAttribute('aria-label'));
    expect(names).toEqual([
      en.t('websiteAtWorkFaviconAlt'),
      en.t('websiteAtWorkPageAlt'),
      en.t('websiteAtWorkComponentAlt'),
    ]);
  });
});

describe('REQ-PLAY-004 the home hero compares the shop without and with SiteMark', () => {
  const hero = () => within(main()).getByRole('heading', { level: 1 }).closest('section');

  it.each([
    [
      'index.html',
      'Compare the shop without and with SiteMark',
      'Try your own mark in the playground',
    ],
    [
      'nl/index.html',
      'Vergelijk de winkel zonder en met SiteMark',
      'Probeer je eigen markering bij Uitproberen',
    ],
  ])('%s: the hero island has the slider and links the playground', (file, slider, link) => {
    showPage(pages, file);
    const island = hero()?.querySelector<HTMLElement>('[data-island="heroCompare"]');
    expect(island).toBeTruthy();
    const inside = within(island ?? document.body);
    expect(inside.getByRole('slider').getAttribute('aria-label')).toBe(slider);
    expect(inside.queryAllByRole('radio')).toEqual([]);
    const playground = within(hero() ?? document.body).queryByRole('link', { name: link });
    expect(playground?.getAttribute('href')).toBe(
      file.startsWith('nl/') ? '/SiteMark/nl/playground/' : '/SiteMark/playground/',
    );
  });
});
