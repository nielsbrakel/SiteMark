import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import { SiteLinks } from './SiteLinks';

const hrefs = () => screen.getAllByRole('link').map((link) => link.getAttribute('href'));

describe('REQ-POP-003 REQ-OPT-001 the popup and options footer links the website, GitHub and the privacy policy', () => {
  it('opens each link in a new tab without opener or referrer', () => {
    render(<SiteLinks />);
    expect(hrefs()).toEqual([
      'https://nielsbrakel.github.io/SiteMark/',
      'https://github.com/nielsbrakel/SiteMark',
      'https://nielsbrakel.github.io/SiteMark/privacy/',
    ]);
    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('links the Dutch privacy policy in a Dutch browser', () => {
    vi.spyOn(browser.i18n, 'getUILanguage').mockReturnValue('nl');
    render(<SiteLinks />);
    expect(hrefs().at(-1)).toBe('https://nielsbrakel.github.io/SiteMark/nl/privacy/');
  });
});
