import { cleanup, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { Markdown } from './markdown';

afterEach(cleanup);

const show = (source: string, file = 'PRIVACY.md') =>
  render(<Markdown source={source} file={file} />).container;

const linkTo = (name: string) => screen.getByRole('link', { name });

describe('REQ-WEB-006 Markdown becomes React elements with raw HTML switched off', () => {
  it('renders headings, paragraphs, lists and emphasis', () => {
    const container = show('# Title\n\nSome *text*.\n\n- one\n- two\n');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Title');
    expect(container.querySelector('p em')?.textContent).toBe('text');
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['one', 'two']);
  });

  it('drops raw HTML instead of rendering it', () => {
    const html = renderToString(
      <Markdown
        source={
          'Hi <b onclick="x()">there</b>\n\n<script>alert(1)</script>\n\n<img src=x onerror=y>'
        }
        file="PRIVACY.md"
      />,
    );
    expect(html).not.toMatch(/<(script|b|img)\b/);
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('onerror');
    expect(html).toContain('Hi');
  });

  it('renders GFM tables and strikethrough', () => {
    const container = show('| Data | Where |\n| --- | --- |\n| Marks | Your browser |\n\n~~old~~');
    const table = screen.getByRole('table');
    expect([...table.querySelectorAll('th')].map((th) => th.textContent)).toEqual([
      'Data',
      'Where',
    ]);
    expect([...table.querySelectorAll('td')].map((td) => td.textContent)).toEqual([
      'Marks',
      'Your browser',
    ]);
    expect(container.querySelector('del')?.textContent).toBe('old');
  });

  it('gives every heading an anchor id from its text', () => {
    show(
      '# Privacy policy\n\n## What we collect\n\n### Één ding: "cookies"!\n\n## What we collect',
    );
    const ids = screen.getAllByRole('heading').map((heading) => heading.id);
    expect(ids).toEqual([
      'privacy-policy',
      'what-we-collect',
      'een-ding-cookies',
      'what-we-collect-1',
    ]);
  });

  it('renders the same ids on every render, so hydration matches', () => {
    const source = '## A\n\n## A\n\n## B';
    const first = renderToString(<Markdown source={source} file="PRIVACY.md" />);
    expect(renderToString(<Markdown source={source} file="PRIVACY.md" />)).toBe(first);
    expect(first).toContain('id="a-1"');
  });

  it('drops images, so a Markdown file can never load anything', () => {
    const container = show('![logo](https://example.com/logo.png)\n\n![local](./logo.png)');
    expect(container.querySelector('img')).toBeNull();
  });
});

describe('REQ-WEB-006 Markdown links are safe and point to real places', () => {
  it('marks external links noopener noreferrer', () => {
    show('See [GitHub](https://github.com/nielsbrakel/SiteMark) and https://example.com.');
    expect(linkTo('GitHub').getAttribute('href')).toBe('https://github.com/nielsbrakel/SiteMark');
    expect(linkTo('GitHub').getAttribute('rel')).toBe('noopener noreferrer');
    expect(linkTo('https://example.com').getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('rewrites repository-relative links to GitHub', () => {
    show(
      '[security](SECURITY.md), [support](.github/SUPPORT.md#contact), [license](./LICENSE)',
      'PRIVACY.md',
    );
    const blob = 'https://github.com/nielsbrakel/SiteMark/blob/main';
    expect(linkTo('security').getAttribute('href')).toBe(`${blob}/SECURITY.md`);
    expect(linkTo('support').getAttribute('href')).toBe(`${blob}/.github/SUPPORT.md#contact`);
    expect(linkTo('license').getAttribute('href')).toBe(`${blob}/LICENSE`);
    expect(linkTo('security').getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('resolves relative links against the folder of the Markdown file', () => {
    show(
      '[up](../../../../SECURITY.md) [side](other.md) [too far](../../../../../x.md)',
      'website/content/en/help/topic.md',
    );
    const blob = 'https://github.com/nielsbrakel/SiteMark/blob/main';
    expect(linkTo('up').getAttribute('href')).toBe(`${blob}/SECURITY.md`);
    expect(linkTo('side').getAttribute('href')).toBe(`${blob}/website/content/en/help/other.md`);
    expect(linkTo('too far').getAttribute('href')).toBe(`${blob}/x.md`);
  });

  it('keeps links to a section of the same page', () => {
    show('[Jump](#what-we-collect)');
    expect(linkTo('Jump').getAttribute('href')).toBe('#what-we-collect');
    expect(linkTo('Jump').getAttribute('rel')).toBeNull();
  });

  it('neutralizes script URLs', () => {
    show('[bad](javascript:alert(1))');
    expect(linkTo('bad').getAttribute('href') ?? '').not.toMatch(/javascript/i);
  });
});
