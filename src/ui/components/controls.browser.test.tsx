import '@/styles/base.css';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { Button } from './Button';
import { Card } from './Card';
import { Field } from './Field';
import { IconButton } from './IconButton';
import { Segmented } from './Segmented';
import { Slider } from './Slider';
import { Switch } from './Switch';

// Real layout and cascade (tokens.css + CSS Modules) in Chromium: focus rings, boundaries, target
// sizes and token colors can't be checked in happy-dom.

afterEach(() => cleanup());

const noop = () => undefined;

/** The computed value of a color token, e.g. `rgb(166, 61, 40)`. */
function tokenColor(name: string): string {
  const probe = document.createElement('span');
  probe.style.setProperty('color', `var(${name})`);
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

const box = (el: Element) => el.getBoundingClientRect();

const controls: readonly [string, () => ReactElement][] = [
  ['Button', () => <Button>Go</Button>],
  ['primary Button', () => <Button variant="primary">Go</Button>],
  ['quiet Button', () => <Button variant="quiet">Go</Button>],
  ['IconButton', () => <IconButton label="Settings" icon={<svg />} />],
  ['Switch', () => <Switch label="On" checked={false} onChange={noop} />],
  ['Field', () => <Field label="Name">{(control) => <input {...control} />}</Field>],
  [
    'Segmented',
    () => (
      <Segmented
        label="Theme"
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
        value="light"
        onChange={noop}
      />
    ),
  ],
  ['Slider', () => <Slider label="Opacity" value={5} min={0} max={10} onChange={noop} />],
];

describe('REQ-A11Y-003 every control shows a focus ring in --sm-focus-color', () => {
  it.each(controls)('%s', async (_name, ui) => {
    render(ui());
    await userEvent.tab();
    const focused = document.activeElement as HTMLElement;
    expect(focused).not.toBe(document.body);
    const style = getComputedStyle(focused);
    expect(style.outlineStyle).toBe('solid');
    expect(style.outlineWidth).toBe('2px');
    expect(style.outlineColor).toBe(tokenColor('--sm-focus-color'));
  });
});

describe('REQ-A11Y-009 targets are at least 24 × 24 px', () => {
  it.each(controls)('%s', (_name, ui) => {
    render(ui());
    const target = document.querySelector('button, input, select, [role="radio"]') as HTMLElement;
    expect(box(target).width).toBeGreaterThanOrEqual(24);
    expect(box(target).height).toBeGreaterThanOrEqual(24);
  });

  it('IconButton is a 32 × 32 px circle', () => {
    render(<IconButton label="Settings" icon={<svg />} />);
    const button = screen.getByRole('button');
    expect([box(button).width, box(button).height]).toEqual([32, 32]);
  });
});

describe('REQ-A11Y-008 control boundaries use --sm-control-border (3:1)', () => {
  const border = tokenColor.bind(null, '--sm-control-border');

  it('the switch track', () => {
    render(<Switch label="On" checked={false} onChange={noop} />);
    expect(getComputedStyle(screen.getByRole('switch')).borderTopColor).toBe(border());
    expect(getComputedStyle(screen.getByRole('switch')).borderTopWidth).toBe('1px');
  });

  it('the field control', () => {
    render(<Field label="Name">{(control) => <input {...control} />}</Field>);
    expect(getComputedStyle(screen.getByLabelText('Name')).borderTopColor).toBe(border());
  });

  it('the segmented group', () => {
    render(
      <Segmented
        label="Theme"
        options={[{ value: 'light', label: 'Light' }]}
        value="light"
        onChange={noop}
      />,
    );
    expect(getComputedStyle(screen.getByRole('radiogroup')).borderTopColor).toBe(border());
  });

  it('an invalid field control switches to --sm-danger', () => {
    render(
      <Field label="Name" error="Required">
        {(control) => <input {...control} />}
      </Field>,
    );
    expect(getComputedStyle(screen.getByLabelText('Name')).borderTopColor).toBe(
      tokenColor('--sm-danger'),
    );
  });
});

describe('REQ-THEME-002 components take their colors from the tokens', () => {
  it('a primary button fills with the accent', () => {
    render(<Button variant="primary">Go</Button>);
    const style = getComputedStyle(screen.getByRole('button'));
    expect(style.backgroundColor).toBe(tokenColor('--sm-accent'));
    expect(style.color).toBe(tokenColor('--sm-on-accent'));
  });

  it('an active switch fills its track with the accent and moves the knob to the end', () => {
    const { rerender } = render(<Switch label="On" checked={false} onChange={noop} />);
    const toggle = screen.getByRole('switch');
    const knob = toggle.firstElementChild as HTMLElement;
    const offLeft = box(knob).left;
    rerender(<Switch label="On" checked onChange={noop} />);
    expect(getComputedStyle(toggle).backgroundColor).toBe(tokenColor('--sm-accent'));
    expect(box(knob).left).toBeGreaterThan(offLeft);
  });

  it('a card sits on the surface color with a large radius', () => {
    render(
      <Card>
        <p>Content</p>
      </Card>,
    );
    const style = getComputedStyle(screen.getByText('Content').parentElement as HTMLElement);
    expect(style.backgroundColor).toBe(tokenColor('--sm-surface'));
    expect(style.borderTopLeftRadius).toBe('20px');
  });
});
