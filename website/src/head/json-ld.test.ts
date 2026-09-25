import { describe, expect, it } from 'vitest';
import { decode } from '../../tests/html';
import { prerenderedPages } from '../../tests/unit/rendered-pages';
import { jsonLdText, softwareApplication } from './json-ld';

const JSON_LD = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;

describe('REQ-SEO-005 the home routes describe SiteMark as a SoftwareApplication', () => {
  it('names the app, its category, browsers, price, license and URL', () => {
    const data = softwareApplication({
      locale: 'nl',
      description: 'Markeert websites.',
      url: 'https://nielsbrakel.github.io/SiteMark/nl/',
    });
    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'SiteMark',
      description: 'Markeert websites.',
      url: 'https://nielsbrakel.github.io/SiteMark/nl/',
      inLanguage: 'nl',
      applicationCategory: 'BrowserApplication',
      operatingSystem: 'Chrome, Edge, Firefox',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      license: 'https://github.com/nielsbrakel/SiteMark/blob/main/LICENSE',
      image: 'https://nielsbrakel.github.io/SiteMark/social-preview.png',
    });
  });

  it('writes JSON that can never close its script element', () => {
    const text = jsonLdText({ name: '</script><script>alert(1)</script>', note: '<!--' });
    expect(text).not.toContain('<');
    expect(JSON.parse(text)).toEqual({
      name: '</script><script>alert(1)</script>',
      note: '<!--',
    });
  });

  it('is in both home pages, as data the browser never runs', async () => {
    const homes = (await prerenderedPages()).filter(({ file }) =>
      /^(nl\/)?index\.html$/.test(file),
    );
    expect(homes).toHaveLength(2);
    for (const { file, html } of homes) {
      const blocks = [...html.matchAll(JSON_LD)].map((match) => match[1] ?? '');
      expect(blocks, file).toHaveLength(1);
      const data = JSON.parse(decode(blocks[0] ?? '')) as Record<string, unknown>;
      expect(data['@type'], file).toBe('SoftwareApplication');
      expect(data.inLanguage, file).toBe(file.startsWith('nl/') ? 'nl' : 'en');
      expect(data.url, file).toBe(
        `https://nielsbrakel.github.io/SiteMark/${file.replace('index.html', '')}`,
      );
    }
  });

  it('is only on the home pages', async () => {
    const others = (await prerenderedPages()).filter(
      ({ file }) => !/^(nl\/)?index\.html$/.test(file),
    );
    for (const { file, html } of others) expect(html, file).not.toMatch(JSON_LD);
  });
});
