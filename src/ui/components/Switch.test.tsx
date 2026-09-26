import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../tests/unit/axe';
import { Switch, type SwitchProps } from './Switch';

type HarnessProps = Omit<SwitchProps, 'checked' | 'onChange'> & {
  readonly initial?: boolean;
  readonly onChange?: (checked: boolean) => void;
};

function Harness({ initial = false, onChange, ...props }: HarnessProps) {
  const [checked, setChecked] = useState(initial);
  const change = (next: boolean) => {
    onChange?.(next);
    setChecked(next);
  };
  return <Switch {...props} checked={checked} onChange={change} />;
}

describe('REQ-A11Y-003 REQ-A11Y-008 Switch', () => {
  it('is a switch named by its visible label', () => {
    render(<Harness label="Production" />);
    const toggle = screen.getByRole('switch', { name: 'Production' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(toggle).toHaveAttribute('type', 'button');
    expect(screen.getByText('Production')).toBeVisible();
    expect(screen.getByText('Production')).not.toHaveClass('sm-visually-hidden');
  });

  it('toggles on click and reports the new value', () => {
    const onChange = vi.fn();
    render(<Harness label="Production" onChange={onChange} />);
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles when its label is clicked', () => {
    const onChange = vi.fn();
    render(<Harness label="Production" onChange={onChange} />);
    fireEvent.click(screen.getByText('Production'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('can hide its label visually but keeps it as the name', () => {
    render(<Harness label="Staging" labelHidden initial />);
    expect(screen.getByRole('switch', { name: 'Staging', checked: true })).toBeInTheDocument();
    expect(screen.getByText('Staging')).toHaveClass('sm-visually-hidden');
  });

  it('links its description', () => {
    render(<Harness label="Production" description="Needs a URL pattern first" />);
    expect(screen.getByRole('switch')).toHaveAccessibleDescription('Needs a URL pattern first');
  });

  it('does nothing while disabled', () => {
    const onChange = vi.fn();
    render(<Harness label="Production" disabled onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it.each([false, true])('has no axe violations (checked: %s)', async (initial) => {
    const { container } = render(
      <Harness label="Production" description="Shown on 3 sites" initial={initial} />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
