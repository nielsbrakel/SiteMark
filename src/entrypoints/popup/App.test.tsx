import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PopupApp } from './App';

vi.mock('@/lib/i18n/browser-source', () => ({ t: (key: string) => key }));

describe('PopupApp (scaffold)', () => {
  it('renders the popup heading', () => {
    render(<PopupApp />);
    expect(screen.getByRole('heading', { name: 'popupTitle' })).toBeInTheDocument();
  });
});
