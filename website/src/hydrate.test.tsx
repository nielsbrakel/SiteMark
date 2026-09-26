import { act, fireEvent, screen } from '@testing-library/react';
import type { Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { renderPages } from './entry-server';
import { hydrateIslands } from './hydrate';

let roots: Root[] = [];

/** Puts a prerendered page's <html> attributes and #root into the test document. */
async function loadPrerendered(file: string): Promise<HTMLElement> {
  const page = (await renderPages({ script: 'assets/entry-client.js', styles: [] })).find(
    (p) => p.file === file,
  );
  if (!page) throw new Error(`${file} was not prerendered`);
  // biome-ignore lint/nursery/noJsRestrictedProperties: parses the prerendered test fixture
  const parsed = new DOMParser().parseFromString(page.html, 'text/html');
  for (const { name, value } of parsed.documentElement.attributes) {
    document.documentElement.setAttribute(name, value);
  }
  const container = parsed.getElementById('root');
  if (!container) throw new Error(`${file} has no #root`);
  document.body.replaceChildren(document.importNode(container, true));
  return document.getElementById('root') as HTMLElement;
}

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount();
  });
  roots = [];
  document.body.replaceChildren();
  delete document.documentElement.dataset.theme;
  window.localStorage.clear();
});

describe('REQ-WEB-002 the browser hydrates only the interactive islands of a prerendered page (D-245)', () => {
  it.each(['index.html', 'nl/index.html'])(
    '%s: marks the theme toggle as an island in the prerendered HTML',
    async (file) => {
      const container = await loadPrerendered(file);
      const islands = [...container.querySelectorAll<HTMLElement>('[data-island]')];
      expect(islands.map((island) => island.dataset.island)).toEqual(['themeToggle']);
      expect(islands[0]?.querySelector('fieldset')).not.toBeNull();
    },
  );

  it.each([
    ['index.html', 'Never confuse production with test again'],
    ['nl/index.html', 'Verwar productie nooit meer met test'],
  ])(
    'hydrates the islands of %s without a mismatch and keeps the server DOM',
    async (file, heading) => {
      const container = await loadPrerendered(file);
      const serverHeading = container.querySelector('h1');
      const serverToggle = container.querySelector('[data-island] fieldset');
      expect(serverHeading?.textContent).toBe(heading);
      const onRecoverableError = vi.fn();
      await act(async () => {
        roots = await hydrateIslands(document, { onRecoverableError });
      });
      expect(roots).toHaveLength(1);
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(container.querySelector('h1')).toBe(serverHeading);
      expect(container.querySelector('[data-island] fieldset')).toBe(serverToggle);
    },
  );

  it('makes the theme toggle work after hydration', async () => {
    await loadPrerendered('index.html');
    await act(async () => {
      roots = await hydrateIslands(document);
    });
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Dark' })));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('leaves a document alone that has no islands or no known locale', async () => {
    await loadPrerendered('index.html');
    document.documentElement.dataset.locale = 'fr';
    await expect(hydrateIslands(document)).resolves.toEqual([]);
    document.documentElement.dataset.locale = 'en';
    document.body.replaceChildren();
    await expect(hydrateIslands(document)).resolves.toEqual([]);
  });

  it('skips an island it does not know', async () => {
    const container = await loadPrerendered('index.html');
    const island = container.querySelector<HTMLElement>('[data-island]');
    if (island) island.dataset.island = 'nowhere';
    await expect(hydrateIslands(document)).resolves.toEqual([]);
  });
});
