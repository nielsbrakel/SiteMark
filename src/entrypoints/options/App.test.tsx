import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OptionsApp } from './App';

vi.mock('@/lib/i18n/browser-source', () => ({ t: (key: string) => key }));

describe('OptionsApp (scaffold)', () => {
  it('renders the options heading', () => {
    render(<OptionsApp />);
    expect(screen.getByRole('heading', { name: 'optionsTitle' })).toBeInTheDocument();
  });
});
