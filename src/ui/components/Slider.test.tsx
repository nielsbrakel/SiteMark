import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../tests/unit/axe';
import { Slider } from './Slider';

function Harness({ onChange }: { readonly onChange?: (value: number) => void }) {
  const [value, setValue] = useState(8);
  const change = (next: number) => {
    onChange?.(next);
    setValue(next);
  };
  return (
    <Slider
      label="Opacity"
      value={value}
      min={3}
      max={15}
      step={1}
      onChange={change}
      formatValue={(n) => `${n} %`}
    />
  );
}

describe('REQ-A11Y-003 REQ-A11Y-009 Slider', () => {
  it('is a native range named by its label, with its bounds', () => {
    render(<Harness />);
    const slider = screen.getByRole('slider', { name: 'Opacity' });
    expect(slider).toHaveAttribute('type', 'range');
    expect(slider).toHaveAttribute('min', '3');
    expect(slider).toHaveAttribute('max', '15');
    expect(slider).toHaveAttribute('step', '1');
    expect(slider).toHaveValue('8');
  });

  it('shows the formatted value in an output and as the value text', () => {
    render(<Harness />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuetext', '8 %');
    const output = screen.getByRole('status');
    expect(output.tagName).toBe('OUTPUT');
    expect(output).toHaveTextContent('8 %');
    expect(output).toHaveAttribute('for', slider.id);
  });

  it('reports changes as numbers and follows the value', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '12' } });
    expect(onChange).toHaveBeenCalledWith(12);
    expect(screen.getByRole('status')).toHaveTextContent('12 %');
  });

  it('shows the plain number without a formatter', () => {
    render(<Slider label="Width" value={2} min={1} max={8} onChange={() => undefined} />);
    expect(screen.getByRole('status')).toHaveTextContent('2');
    expect(screen.getByRole('slider')).not.toHaveAttribute('aria-valuetext');
  });

  it('has no axe violations', async () => {
    const { container } = render(<Harness />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
