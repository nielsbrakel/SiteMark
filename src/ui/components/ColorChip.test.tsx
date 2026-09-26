import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../tests/unit/axe';
import type { Hex } from '../../core/model/schema';
import { ColorChip } from './ColorChip';

const RED = '#c93a2e' as Hex;

describe('REQ-A11Y-008 REQ-THEME-002 ColorChip', () => {
  it('paints the mark color through a custom property, not a style attribute', () => {
    const { container } = render(<ColorChip color={RED} />);
    const chip = container.firstElementChild as HTMLElement;
    expect(chip.style.getPropertyValue('--sm-chip-color')).toBe(RED);
    expect(chip).toHaveAttribute('aria-hidden', 'true');
  });

  it('is an image named by its label when it carries meaning', () => {
    render(<ColorChip color={RED} label="Red" />);
    expect(screen.getByRole('img', { name: 'Red' })).not.toHaveAttribute('aria-hidden');
  });

  it('ignores a color that is not a #rrggbb hex', () => {
    const { container } = render(<ColorChip color={'red; x: y' as Hex} />);
    expect(
      (container.firstElementChild as HTMLElement).style.getPropertyValue('--sm-chip-color'),
    ).toBe('');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <p>
        <ColorChip color={RED} /> <ColorChip color={RED} label="Red" />
      </p>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
