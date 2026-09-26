import { readFileSync } from 'node:fs';
import { screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { titleOf } from '../../tests/html';
import { type RenderedPage, renderPages } from '../entry-server';

let pages: RenderedPage[];

beforeAll(async () => {
  // No stylesheets: the test document would try to load them.
  pages = await renderPages({ script: 'assets/entry-client.js', styles: [] });
});

afterEach(() => {
  document.body.replaceChildren();
});

/** Shows the #root of a prerendered page in the test document; returns the whole HTML. */
function show(file: string): string {
  const page = pages.find((p) => p.file === file);
  expect(page, `${file} is prerendered`).toBeDefined();
  // biome-ignore lint/nursery/noJsRestrictedProperties: parses the prerendered test fixture
  const parsed = new DOMParser().parseFromString(page?.html ?? '', 'text/html');
  const root = parsed.getElementById('root');
  document.body.replaceChildren(...(root ? [document.importNode(root, true)] : []));
  return page?.html ?? '';
}

const markdownHeadings = (file: string) =>
  [...readFileSync(file, 'utf8').matchAll(/^#{1,6} (.+)$/gm)].map((m) => (m[1] ?? '').trim());

const main = () => screen.getByRole('main');

describe('REQ-POLICY-001 /privacy/ renders PRIVACY.md and /nl/privacy/ renders PRIVACY.nl.md', () => {
  it.each([
    ['privacy/index.html', 'PRIVACY.md', 'Privacy policy'],
    ['nl/privacy/index.html', 'PRIVACY.nl.md', 'Privacyverklaring'],
  ])('%s shows every heading of %s, in order', (file, policy, h1) => {
    const html = show(file);
    expect(html).toContain('data-route="privacy"');
    const shown = within(main())
      .getAllByRole('heading')
      .map((heading) => heading.textContent);
    expect(shown).toEqual(markdownHeadings(policy));
    expect(within(main()).getByRole('heading', { level: 1 }).textContent).toBe(h1);
  });

  it('has its own title and marks Privacy as the current page', () => {
    const html = show('nl/privacy/index.html');
    expect(titleOf(html)).toBe('Privacyverklaring · SiteMark');
    const nav = screen.getByRole('navigation', { name: 'Hoofdmenu' });
    const current = within(nav)
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page');
    expect(current.map((link) => link.textContent)).toEqual(['Privacy']);
    expect(titleOf(show('privacy/index.html'))).toBe('Privacy policy · SiteMark');
  });

  it('turns links to repository files into GitHub links that leave safely', () => {
    show('privacy/index.html');
    const security = within(main()).getByRole('link', { name: 'SECURITY.md' });
    expect(security.getAttribute('href')).toBe(
      'https://github.com/nielsbrakel/SiteMark/blob/main/SECURITY.md',
    );
    expect(security.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('is linked from the navigation and the footer of every page', () => {
    show('index.html');
    const links = screen
      .queryAllByRole('link', { name: 'Privacy' })
      .map((link) => link.getAttribute('href'));
    expect(links).toEqual(['/SiteMark/privacy/', '/SiteMark/privacy/']);
  });
});

describe('REQ-POLICY-004 the privacy page shows its Last updated date', () => {
  it.each([
    ['privacy/index.html', 'PRIVACY.md', /^(Last updated: \d{4}-\d{2}-\d{2})$/m],
    ['nl/privacy/index.html', 'PRIVACY.nl.md', /^(Laatst bijgewerkt: \d{4}-\d{2}-\d{2})$/m],
  ])('%s shows the date line of %s', (file, policy, line) => {
    show(file);
    const date = readFileSync(policy, 'utf8').match(line)?.[1];
    expect(date).toBeDefined();
    expect(within(main()).getByText(date ?? '-')).toBeDefined();
  });
});
