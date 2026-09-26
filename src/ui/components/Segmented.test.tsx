import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../tests/unit/axe';
import { Segmented, type SegmentedOption } from './Segmented';

type Corner = 'tl' | 'tr' | 'bl' | 'br';

const corners: readonly SegmentedOption<Corner>[] = [
  { value: 'tl', label: 'Top left' },
  { value: 'tr', label: 'Top right' },
  { value: 'bl', label: 'Bottom left' },
  { value: 'br', label: 'Bottom right' },
];

function Harness({
  initial = 'tr',
  onChange,
  disabled = false,
}: {
  readonly initial?: Corner;
  readonly onChange?: (value: Corner) => void;
  readonly disabled?: boolean;
}) {
  const [value, setValue] = useState<Corner>(initial);
  const change = (next: Corner) => {
    onChange?.(next);
    setValue(next);
  };
  return (
    <Segmented
      label="Corner"
      options={corners}
      value={value}
      onChange={change}
      disabled={disabled}
    />
  );
}

const radio = (name: string) => screen.getByRole('radio', { name });

describe('REQ-A11Y-003 REQ-A11Y-008 Segmented', () => {
  it('is a labelled radio group with one radio per option', () => {
    render(<Harness />);
    const group = screen.getByRole('radiogroup', { name: 'Corner' });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((option) => option.textContent)).toEqual([
      'Top left',
      'Top right',
      'Bottom left',
      'Bottom right',
    ]);
    expect(radio('Top right')).toHaveAttribute('aria-checked', 'true');
    expect(radio('Top left')).toHaveAttribute('aria-checked', 'false');
  });

  it('puts only the selected option in the tab order (roving tabindex)', () => {
    render(<Harness />);
    expect(screen.getAllByRole('radio').map((option) => option.tabIndex)).toEqual([-1, 0, -1, -1]);
  });

  it('selects an option on click', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.click(radio('Bottom left'));
    expect(onChange).toHaveBeenCalledWith('bl');
    expect(radio('Bottom left')).toHaveAttribute('aria-checked', 'true');
  });

  it.each([
    ['ArrowRight', 'tr', 'bl'],
    ['ArrowDown', 'tr', 'bl'],
    ['ArrowLeft', 'tr', 'tl'],
    ['ArrowUp', 'tr', 'tl'],
    ['ArrowRight', 'br', 'tl'],
    ['ArrowLeft', 'tl', 'br'],
    ['Home', 'bl', 'tl'],
    ['End', 'tl', 'br'],
  ] as const)('%s from %s selects and focuses %s', (key, from, to) => {
    const onChange = vi.fn();
    render(<Harness initial={from} onChange={onChange} />);
    const current = screen.getByRole('radio', { checked: true });
    current.focus();
    fireEvent.keyDown(current, { key });
    expect(onChange).toHaveBeenCalledWith(to);
    const next = screen.getByRole('radio', { checked: true });
    expect(next).toHaveFocus();
    expect(next.tabIndex).toBe(0);
  });

  it('ignores other keys', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.keyDown(radio('Top right'), { key: 'a' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does nothing while disabled', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} disabled />);
    fireEvent.click(radio('Top left'));
    fireEvent.keyDown(radio('Top right'), { key: 'ArrowRight' });
    expect(onChange).not.toHaveBeenCalled();
    expect(radio('Top left')).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Harness />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
