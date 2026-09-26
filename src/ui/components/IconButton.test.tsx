import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../tests/unit/axe';
import { IconButton } from './IconButton';

describe('REQ-A11Y-003 REQ-A11Y-009 IconButton', () => {
  it('is a native button named by its required label, with the label as tooltip', () => {
    render(<IconButton label="Settings" icon={<svg data-testid="icon" />} />);
    const button = screen.getByRole('button', { name: 'Settings' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('title', 'Settings');
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('forwards clicks and other button attributes', () => {
    const onClick = vi.fn();
    render(
      <IconButton
        label="Move up"
        icon={<svg />}
        onClick={onClick}
        aria-describedby="hint"
        className="extra"
      />,
    );
    const button = screen.getByRole('button', { name: 'Move up' });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
    expect(button).toHaveAttribute('aria-describedby', 'hint');
    expect(button).toHaveClass('extra');
  });

  it('ignores clicks while disabled', () => {
    const onClick = vi.fn();
    render(<IconButton label="Delete" icon={<svg />} disabled onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { container } = render(<IconButton label="Delete" icon={<svg />} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
