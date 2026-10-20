import { describe, expect, it } from 'vitest';
import { type Store, stores } from './stores';

/** Where each store's listings live: a configured URL must be a listing on that store. */
const LISTING: Record<Store['id'], RegExp> = {
  chrome: /^https:\/\/chrome\.google\.com\/webstore\/detail\/[a-p]{32}$/,
  edge: /^https:\/\/microsoftedge\.microsoft\.com\/addons\/detail\/[\w-]+\/[a-z]{32}$/,
  firefox: /^https:\/\/addons\.mozilla\.org\/[A-Za-z-]+\/firefox\/addon\/[\w-]+\/$/,
  safari: /^https:\/\/apps\.apple\.com\/[a-z]{2}\/app\/[\w-]+\/id\d+$/,
};

describe('REQ-PAGE-002 the install buttons come from one config file', () => {
  it('lists Chrome, Edge, Firefox and Safari, in that order', () => {
    expect(stores().map((s) => s.id)).toEqual(['chrome', 'edge', 'firefox', 'safari']);
  });

  it('only holds real listing URLs on the store itself, or null until the listing exists', () => {
    for (const { id, url } of stores()) {
      if (url !== null) expect(url, id).toMatch(LISTING[id]);
    }
  });

  it('has a listing for Chrome, Edge and Firefox, and none for Safari yet', () => {
    expect(Object.fromEntries(stores().map(({ id, url }) => [id, url !== null]))).toEqual({
      chrome: true,
      edge: true,
      firefox: true,
      safari: false,
    });
  });
});
