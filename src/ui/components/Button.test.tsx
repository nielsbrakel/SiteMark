import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../tests/unit/axe';
import { Button } from './Button';

describe('REQ-A11Y-003 REQ-THEME-002 Button', () => {
  it('is a native button that does not submit forms by default', () => {
    const onSubmit = vi.fn((event: Event) => event.preventDefault());
    render(
      <form onSubmit={(event) => onSubmit(event.nativeEvent)}>
        <Button>Save</Button>
      </form>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
    fireEvent.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('can be a submit button', () => {
    render(<Button type="submit">Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('is named by its label; the icon is decorative', () => {
    render(<Button icon={<svg data-testid="icon" />}>Pick element</Button>);
    const button = screen.getByRole('button', { name: 'Pick element' });
    const icon = screen.getByTestId('icon').parentElement;
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(button).toContainElement(icon);
  });

  it.each(['primary', 'secondary', 'quiet'] as const)('shows the %s variant', (variant) => {
    render(<Button variant={variant}>Go</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', variant);
  });

  it('is secondary by default', () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'secondary');
  });

  it('forwards clicks, the pressed state and extra classes', () => {
    const onClick = vi.fn();
    render(
      <Button aria-pressed={true} className="wide" onClick={onClick}>
        Hide on this tab
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Hide on this tab', pressed: true });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
    expect(button).toHaveClass('wide');
  });

  it('ignores clicks while disabled', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it.each(['primary', 'secondary', 'quiet'] as const)(
    '%s has no axe violations',
    async (variant) => {
      const { container } = render(
        <Button variant={variant} icon={<svg />}>
          Go
        </Button>,
      );
      expect(await axeViolations(container)).toEqual([]);
    },
  );
});
