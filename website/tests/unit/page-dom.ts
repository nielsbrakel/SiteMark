import { expect } from 'vitest';
import { type RenderedPage, renderPages } from '../../src/entry-server';

/** Every prerendered page, without stylesheets (a test document would try to load them). */
export function pagesForDom(): Promise<RenderedPage[]> {
  return renderPages({ script: 'assets/entry-client.js', styles: [] });
}

/**
 * Shows the #root of a prerendered page in the test document, so Testing Library can query it as a
 * visitor sees it. Fails the test (an assertion, not a crash) when the page isn't prerendered.
 * Returns the page's whole HTML.
 */
export function showPage(pages: readonly RenderedPage[], file: string): string {
  const page = pages.find((p) => p.file === file);
  expect(page, `${file} is prerendered`).toBeDefined();
  // biome-ignore lint/nursery/noJsRestrictedProperties: parses the prerendered test fixture
  const parsed = new DOMParser().parseFromString(page?.html ?? '', 'text/html');
  const root = parsed.getElementById('root');
  document.body.replaceChildren(...(root ? [document.importNode(root, true)] : []));
  return page?.html ?? '';
}
