import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { pagesForDom, showPage } from '../../tests/unit/page-dom';
import { InstallButtons } from '../components/InstallButtons';
import { type Store, stores } from '../config/stores';
import { screenshotScenes } from '../content/screenshots';
import type { RenderedPage } from '../entry-server';
import { createWebsiteTranslator, loadCatalogs, type WebsiteTranslator } from '../i18n/website-t';
import { HeroPlayground } from '../playground/HeroPlayground';

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

  it('shows a preview of a marked page next to the value proposition', () => {
    showPage(pages, 'index.html');
    const hero = within(main()).getByRole('heading', { level: 1 }).closest('section');
    expect(hero?.querySelector('figure[aria-label="Preview of a marked page"]')).not.toBeNull();
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
    ['index.html', ['Open source', 'No analytics', 'Stays in your browser', 'No network requests']],
    [
      'nl/index.html',
      ['Open source', 'Geen analytics', 'Blijft in je browser', 'Geen netwerkverzoeken'],
    ],
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
  it('links Chrome, Edge and Firefox, and disables Safari (coming in v1.1)', () => {
    showPage(pages, 'index.html');
    const install = within(main()).queryByRole('list', { name: 'Install SiteMark' });
    expect(install).not.toBeNull();
    const buttons = within(install as HTMLElement).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(['Safari: coming in v1.1']);
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
    ['index.html', 'Open this page on a computer to install SiteMark.'],
    ['nl/index.html', 'Open deze pagina op een computer om SiteMark te installeren.'],
  ])('%s tells iPhone visitors to continue on a computer', (file, hint) => {
    showPage(pages, file);
    const install = within(main()).getByRole('list', {
      name: /Install SiteMark|SiteMark installeren/,
    });
    expect(within(install).queryByText(hint)).not.toBeNull();
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

describe('REQ-PAGE-008 the home page shows the screenshots of its language, in both themes', () => {
  it.each([
    ['index.html', 'en', 'SiteMark at work'],
    ['nl/index.html', 'nl', 'SiteMark aan het werk'],
  ])('%s shows every scene, in light and dark, with the WebP first', (file, locale, heading) => {
    showPage(pages, file);
    const title = within(main()).queryByRole('heading', { level: 2, name: heading });
    expect(title).not.toBeNull();
    const figures = [...(title?.closest('section')?.querySelectorAll('figure') ?? [])];
    expect(figures).toHaveLength(screenshotScenes().length);
    figures.forEach((figure, index) => {
      const scene = screenshotScenes()[index];
      const pictures = [...figure.querySelectorAll('picture')];
      expect(pictures.map((picture) => picture.dataset.theme)).toEqual(['light', 'dark']);
      for (const picture of pictures) {
        const shot = `/SiteMark/screenshots/${scene}-${picture.dataset.theme}-${locale}`;
        const source = picture.querySelector('source');
        expect(source?.getAttribute('type')).toBe('image/webp');
        expect(source?.getAttribute('srcset')).toBe(`${shot}.webp`);
        const img = picture.querySelector('img');
        expect(img?.getAttribute('src')).toBe(`${shot}.png`);
        // 1280 × 800 files at 2× density, lazy, so the hidden theme's image never loads.
        expect([img?.getAttribute('width'), img?.getAttribute('height')]).toEqual(['640', '400']);
        expect(img?.getAttribute('loading')).toBe('lazy');
      }
      expect(figure.querySelector('figcaption')?.textContent).not.toBe('');
    });
  });

  it.each(['index.html', 'nl/index.html'])(
    '%s describes what each screenshot shows, from the catalog',
    (file) => {
      showPage(pages, file);
      const alts = [...main().querySelectorAll('figure picture img')].map((img) =>
        img.getAttribute('alt'),
      );
      expect(alts).toHaveLength(screenshotScenes().length * 2);
      for (const alt of alts) {
        expect(alt?.length).toBeGreaterThan(40);
        expect(alt).not.toMatch(/screenshot|schermafbeelding/i);
      }
      // Both themes of a scene share their text; the scenes differ.
      expect(new Set(alts).size).toBe(screenshotScenes().length);
    },
  );

  it('uses the English texts on the English page', () => {
    showPage(pages, 'index.html');
    const alts = [...main().querySelectorAll('figure picture img')].map((img) =>
      img.getAttribute('alt'),
    );
    expect(alts[0]).toBe(en.t('websiteScreenshotMarkedPageAlt'));
    expect(alts[2]).toBe(en.t('websiteScreenshotPopupAlt'));
    expect(alts[4]).toBe(en.t('websiteScreenshotOptionsAlt'));
  });
});

describe('REQ-PAGE-008 the screenshots are a tour that shows one scene at a time', () => {
  it.each([
    ['index.html', 'Choose a scene', ['On the page', 'In the popup', 'In the editor']],
    ['nl/index.html', 'Kies een scène', ['Op de pagina', 'In de pop-up', 'In de editor']],
  ])('%s: a radio group picks the scene, and the first scene shows', (file, group, labels) => {
    showPage(pages, file);
    const scenes = within(main()).queryByRole('radiogroup', { name: group });
    expect(scenes).not.toBeNull();
    const radios = within(scenes ?? document.body).queryAllByRole<HTMLInputElement>('radio');
    expect(radios.map((radio) => radio.labels?.[0]?.textContent)).toEqual(labels);
    expect(radios.map((radio) => radio.value)).toEqual([...screenshotScenes()]);
    expect(radios.map((radio) => radio.checked)).toEqual([true, false, false]);
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

describe('REQ-PLAY-004 the home hero is a small playground with the four presets', () => {
  const hero = () => within(main()).getByRole('heading', { level: 1 }).closest('section');

  it.each([
    ['index.html', ['Red', 'Amber', 'Blue', 'Slate'], 'Try your own mark in the playground'],
    [
      'nl/index.html',
      ['Rood', 'Amber', 'Blauw', 'Leisteen'],
      'Probeer je eigen markering bij Uitproberen',
    ],
  ])(
    '%s: the hero island offers only the presets and links the playground',
    (file, names, link) => {
      showPage(pages, file);
      const island = hero()?.querySelector<HTMLElement>('[data-island="heroPlayground"]');
      expect(island).toBeTruthy();
      const radios = within(island ?? document.body).queryAllByRole('radio');
      expect(radios.map((radio) => radio.getAttribute('aria-label'))).toEqual(names);
      expect(within(island ?? document.body).queryAllByRole('checkbox')).toEqual([]);
      expect(within(island ?? document.body).queryAllByRole('textbox')).toEqual([]);
      expect(island?.querySelector('figure')).not.toBeNull();
      const playground = within(hero() ?? document.body).queryByRole('link', { name: link });
      expect(playground?.getAttribute('href')).toBe(
        file.startsWith('nl/') ? '/SiteMark/nl/playground/' : '/SiteMark/playground/',
      );
    },
  );

  it('switches presets from the hero', () => {
    render(<HeroPlayground t={en.t} />);
    expect(screen.getByRole('radio', { name: 'Red' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: 'Slate' }));
    expect(screen.getByRole('radio', { name: 'Slate' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: 'Red' }).getAttribute('aria-checked')).toBe('false');
  });
});
