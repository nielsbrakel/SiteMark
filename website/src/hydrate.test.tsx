import { act } from 'react';
import type { Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { renderPages } from './entry-server';
import { hydratePage } from './hydrate';

let root: Root | undefined;

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
  act(() => root?.unmount());
  root = undefined;
  document.body.replaceChildren();
});

describe('REQ-WEB-002 the browser hydrates the prerendered page (D-245)', () => {
  it.each([
    ['index.html', 'Never confuse production with test again'],
    ['nl/index.html', 'Verwar productie nooit meer met test'],
  ])('hydrates %s without a mismatch and keeps the server DOM', async (file, heading) => {
    const container = await loadPrerendered(file);
    const serverHeading = container.querySelector('h1');
    expect(serverHeading?.textContent).toBe(heading);
    const onRecoverableError = vi.fn();
    await act(async () => {
      root = await hydratePage(document, { onRecoverableError });
    });
    expect(root).toBeDefined();
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.querySelector('h1')).toBe(serverHeading);
  });

  it('leaves a document alone that names no known page', async () => {
    await loadPrerendered('index.html');
    document.documentElement.dataset.route = 'nowhere';
    await expect(hydratePage(document)).resolves.toBeUndefined();
  });
});
