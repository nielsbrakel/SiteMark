import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import pkg from '../../package.json';
import { readManifest, targets } from './targets';

// D-256: the website URL is linked from everywhere people and search engines find SiteMark.
const WEBSITE = 'https://nielsbrakel.github.io/SiteMark/';
const read = (file: string) => (existsSync(file) ? readFileSync(file, 'utf8') : '');

describe('REQ-SEO-006 the website is linked from the package, the manifests, the README and the listings', () => {
  it('is the package.json homepage', () => {
    expect(pkg.homepage).toBe(WEBSITE);
  });

  it.each(targets())('is the homepage_url of the %s manifest', (target) => {
    expect(readManifest(target).homepage_url).toBe(WEBSITE);
  });

  it('is linked from the README', () => {
    expect(read('README.md')).toContain(`](${WEBSITE})`);
  });

  it('fills the website, privacy and support fields of the store listings (T-152)', () => {
    const listing = read('docs/store-listing.md');
    for (const url of [
      WEBSITE,
      `${WEBSITE}privacy/`,
      `${WEBSITE}nl/privacy/`,
      `${WEBSITE}support/`,
      `${WEBSITE}nl/support/`,
    ]) {
      expect(listing).toContain(url);
    }
  });
});
