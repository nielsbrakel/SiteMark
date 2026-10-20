import { describe, expect, it } from 'vitest';
import { robotsTxt } from './robots';

describe('REQ-SEO-003 robots.txt allows crawling and announces the sitemap', () => {
  it('allows every page and links the sitemap by absolute URL', () => {
    expect(robotsTxt()).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://nielsbrakel.github.io/SiteMark/sitemap.xml\n',
    );
  });
});
