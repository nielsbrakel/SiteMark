import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../tests/unit/axe';
import type { Hex } from '../../core/model/schema';
import { ColorSwatches, type ColorSwatchOption } from './ColorSwatches';

const presets: readonly ColorSwatchOption[] = [
  { value: '#c93a2e' as Hex, label: 'Red' },
  { value: '#f4a300' as Hex, label: 'Amber' },
  { value: '#1f6feb' as Hex, label: 'Blue' },
  { value: '#57606a' as Hex, label: 'Slate' },
];

function Harness({
  initial,
  onChange,
}: {
  readonly initial?: Hex | undefined;
  readonly onChange?: (color: Hex) => void;
}) {
  const [value, setValue] = useState<Hex | undefined>(initial);
  const change = (next: Hex) => {
    onChange?.(next);
    setValue(next);
  };
  return <ColorSwatches label="Color" options={presets} value={value} onChange={change} />;
}

const swatch = (name: string) => screen.getByRole('radio', { name });

describe('REQ-A11Y-009 REQ-A11Y-008 ColorSwatches', () => {
  it('is a labelled radio group of named swatches painted with their colors', () => {
    render(<Harness initial={presets[2]?.value} />);
    expect(screen.getByRole('radiogroup', { name: 'Color' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('aria-label'))).toEqual([
      'Red',
      'Amber',
      'Blue',
      'Slate',
    ]);
    expect(swatch('Red').style.getPropertyValue('--sm-swatch-color')).toBe('#c93a2e');
  });

  it('shows the selection with a check mark in a contrasting color, not by color alone', () => {
    render(<Harness initial={presets[1]?.value} />);
    expect(swatch('Amber')).toHaveAttribute('aria-checked', 'true');
    expect(swatch('Amber').querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(swatch('Amber').style.getPropertyValue('--sm-swatch-on')).toBe('#000000');
    expect(swatch('Blue').style.getPropertyValue('--sm-swatch-on')).toBe('#ffffff');
    expect(swatch('Red').querySelector('svg')).toBeNull();
  });

  it('selects on click', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.click(swatch('Slate'));
    expect(onChange).toHaveBeenCalledWith('#57606a');
    expect(swatch('Slate')).toHaveAttribute('aria-checked', 'true');
  });

  it('keeps the first swatch reachable when a custom color is selected', () => {
    render(<Harness initial={'#123456' as Hex} />);
    expect(screen.getAllByRole('radio').map((radio) => radio.tabIndex)).toEqual([0, -1, -1, -1]);
    expect(screen.queryByRole('radio', { checked: true })).not.toBeInTheDocument();
  });

  it('moves the selection with arrow keys', () => {
    const onChange = vi.fn();
    render(<Harness initial={presets[3]?.value} onChange={onChange} />);
    swatch('Slate').focus();
    fireEvent.keyDown(swatch('Slate'), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('#c93a2e');
    expect(swatch('Red')).toHaveFocus();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Harness initial={presets[0]?.value} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
