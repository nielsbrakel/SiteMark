import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../tests/unit/axe';
import { Card } from './Card';

describe('REQ-THEME-002 REQ-A11Y-008 Card', () => {
  it('renders its content in a div by default', () => {
    render(
      <Card>
        <p>Content</p>
      </Card>,
    );
    const card = screen.getByText('Content').parentElement;
    expect(card?.tagName).toBe('DIV');
    expect(card).toHaveAttribute('data-tone', 'neutral');
  });

  it('can be a labelled section with a warning or danger tone', () => {
    render(
      <Card as="section" tone="warning" aria-labelledby="t" className="extra">
        <h2 id="t">Needs access</h2>
      </Card>,
    );
    const card = screen.getByRole('region', { name: 'Needs access' });
    expect(card).toHaveAttribute('data-tone', 'warning');
    expect(card).toHaveClass('extra');
  });

  it.each(['neutral', 'warning', 'danger'] as const)('%s has no axe violations', async (tone) => {
    const { container } = render(
      <Card as="article" tone={tone}>
        <p>Content</p>
      </Card>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
