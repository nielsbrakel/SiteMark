import { describe, expect, it } from 'vitest';
import { screenshotPage } from '../../scripts/screenshot-page';

// The screenshots mark the same "Leaf & Lamp" shop the hero and the playground show (REQ-WEBUX-001).

describe('REQ-WEBUX-001 the screenshot page is the hero example site', () => {
  it.each(['en', 'nl'] as const)(
    'shows the Leaf & Lamp shop with the delete button (%s)',
    (locale) => {
      const html = screenshotPage(locale, 'light');
      expect(html).toContain('Leaf &amp; Lamp'.replace('&amp;', '&'));
      expect(html).toContain('<button id="delete">');
      expect(html).toContain(`lang="${locale}"`);
    },
  );

  it('has a dark palette', () => {
    expect(screenshotPage('en', 'dark')).toContain('--bg:#241d33');
  });
});
