import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { pagesForDom, showPage } from '../../tests/unit/page-dom';
import { InstallButtons } from '../components/InstallButtons';
import { type Store, stores } from '../config/stores';
import { screenshotScenes } from '../content/screenshots';
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
  /chromewebstore\.google\.com|microsoftedge\.microsoft\.com|addons\.mozilla\.org|apps\.apple\.com/;

describe('REQ-PAGE-001 the home page explains SiteMark in one look', () => {
  it.each([
    ['index.html', 'Never confuse production with test again', /^SiteMark is a browser extension/],
    ['nl/index.html', 'Verwar productie nooit meer met test', /^SiteMark is een browserextensie/],
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
      .map((heading) => [heading.textContent, heading.nextElementSibling?.textContent ?? '']);
    expect(cards.map(([title]) => title)).toEqual(titles);
    for (const [, text] of cards) expect(text).toMatch(/^[^.]+\.$|^[^.]+\. [^.]+\.$/);
  });

  it('shows a static hero illustration of a marked page, with a text alternative', () => {
    showPage(pages, 'index.html');
    const hero = within(main()).queryByRole('img', { name: /production website/i });
    expect(hero?.tagName.toLowerCase()).toBe('svg');
    expect(hero?.closest('section')?.querySelectorAll('img')).toHaveLength(0);
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

describe('REQ-PAGE-002 install buttons never link to a store that has no listing yet', () => {
  it('shows Chrome, Edge and Firefox as coming soon and Safari as coming in v1.1', () => {
    showPage(pages, 'index.html');
    const install = within(main()).queryByRole('list', { name: 'Install SiteMark' });
    expect(install).not.toBeNull();
    const buttons = within(install as HTMLElement).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual([
      'Chrome: coming soon',
      'Edge: coming soon',
      'Firefox: coming soon',
      'Safari: coming in v1.1',
    ]);
    for (const button of buttons) expect((button as HTMLButtonElement).disabled).toBe(true);
    const links = within(main()).queryAllByRole('link');
    expect(links.filter((link) => STORE_HOSTS.test(link.getAttribute('href') ?? ''))).toEqual([]);
  });

  it('links a store as soon as its listing URL is configured', () => {
    const chrome =
      'https://chromewebstore.google.com/detail/sitemark/abcdefghijklmnopabcdefghijklmnop';
    const configured: Store[] = stores().map((store) =>
      store.id === 'chrome' ? { ...store, url: chrome } : store,
    );
    render(<InstallButtons stores={configured} t={en.t} />);
    const link = screen.getByRole('link', { name: 'Add to Chrome' });
    expect(link.getAttribute('href')).toBe(chrome);
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.getAllByRole('button')).toHaveLength(3);
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
      const alts = [...main().querySelectorAll('picture img')].map((img) =>
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
    const alts = [...main().querySelectorAll('picture img')].map((img) => img.getAttribute('alt'));
    expect(alts[0]).toBe(en.t('websiteScreenshotMarkedPageAlt'));
    expect(alts[2]).toBe(en.t('websiteScreenshotPopupAlt'));
    expect(alts[4]).toBe(en.t('websiteScreenshotOptionsAlt'));
  });
});
