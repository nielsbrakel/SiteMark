import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HelpLink } from './HelpLink';
import { HelpTip } from './HelpTip';

describe('REQ-POP-008 REQ-OPT-008 help links open the website in a new tab', () => {
  it('links the help index from the header', () => {
    render(<HelpLink />);
    const link = screen.getByRole('link', { name: 'Help' });
    expect(link).toHaveAttribute('href', 'https://nielsbrakel.github.io/SiteMark/help/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows a sentence and a link to the help topic', () => {
    render(<HelpTip topic="url-patterns" text="helpNoMatchLead" link="helpUrlPatternsLink" />);
    const link = screen.getByRole('link', { name: 'How URL patterns work' });
    expect(link).toHaveAttribute(
      'href',
      'https://nielsbrakel.github.io/SiteMark/help/url-patterns/',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link.closest('p')).toHaveTextContent('Not sure which URL to use? How URL patterns work');
  });
});
