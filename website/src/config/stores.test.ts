import { describe, expect, it } from 'vitest';
import { installState, type Store, stores } from './stores';

/** Where each store's listings live: a configured URL must be a listing on that store. */
const LISTING: Record<Store['id'], RegExp> = {
  chrome: /^https:\/\/chromewebstore\.google\.com\/detail\/[\w-]+\/[a-p]{32}$/,
  edge: /^https:\/\/microsoftedge\.microsoft\.com\/addons\/detail\/[\w-]+\/[a-z]{32}$/,
  firefox: /^https:\/\/addons\.mozilla\.org\/[a-z-]+\/firefox\/addon\/[\w-]+\/$/,
  safari: /^https:\/\/apps\.apple\.com\/[a-z]{2}\/app\/[\w-]+\/id\d+$/,
};

const store = (id: Store['id'], url: string | null): Store => {
  const found = stores().find((s) => s.id === id);
  if (!found) throw new Error(`no store ${id}`);
  return { ...found, url };
};

describe('REQ-PAGE-002 the install buttons come from one config file', () => {
  it('lists Chrome, Edge, Firefox and Safari, in that order', () => {
    expect(stores().map((s) => s.id)).toEqual(['chrome', 'edge', 'firefox', 'safari']);
  });

  it('ships Chrome, Edge and Firefox in v1.0 and Safari in v1.1 (M9)', () => {
    expect(Object.fromEntries(stores().map((s) => [s.id, s.release]))).toEqual({
      chrome: 'v1.0',
      edge: 'v1.0',
      firefox: 'v1.0',
      safari: 'v1.1',
    });
  });

  it('only holds real listing URLs on the store itself, or null until the listing exists', () => {
    for (const { id, url } of stores()) {
      if (url !== null) expect(url, id).toMatch(LISTING[id]);
    }
  });

  it('links a store once it has a URL, and shows a coming-soon state before that', () => {
    const chrome =
      'https://chromewebstore.google.com/detail/sitemark/abcdefghijklmnopabcdefghijklmnop';
    expect(installState(store('chrome', chrome))).toBe('live');
    expect(installState(store('firefox', null))).toBe('comingSoon');
    expect(installState(store('safari', null))).toBe('comingLater');
  });
});
