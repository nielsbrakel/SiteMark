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
    expect(main().querySelectorAll('img')).toHaveLength(0);
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
