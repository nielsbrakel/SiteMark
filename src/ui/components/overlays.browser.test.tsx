import '@/styles/base.css';
import { cleanup, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { Hex } from '../../core/model/schema';
import { ColorChip } from './ColorChip';
import { ColorSwatches } from './ColorSwatches';
import { Dialog } from './Dialog';
import { Toast } from './Toast';

// Dialog, Toast and color swatches in real Chromium: the top layer, native Escape handling,
// focus return and layout can't be checked in happy-dom.

afterEach(() => cleanup());

const noop = () => undefined;
const box = (el: Element) => el.getBoundingClientRect();

function tokenColor(name: string): string {
  const probe = document.createElement('span');
  probe.style.setProperty('color', `var(${name})`);
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

const presets = [
  { value: '#c93a2e' as Hex, label: 'Red' },
  { value: '#f4a300' as Hex, label: 'Amber' },
  { value: '#1f6feb' as Hex, label: 'Blue' },
];

describe('REQ-A11Y-009 color swatches are 28 px with an 8 px gap', () => {
  it('lays the swatches out at 28 × 28 px, 8 px apart', () => {
    render(
      <ColorSwatches label="Color" options={presets} value={presets[0]?.value} onChange={noop} />,
    );
    const [first, second] = screen.getAllByRole('radio') as [HTMLElement, HTMLElement];
    expect([box(first).width, box(first).height]).toEqual([28, 28]);
    expect(box(second).left - box(first).right).toBe(8);
  });

  it('fills a swatch with its color and draws the selection ring in the text color', () => {
    render(
      <ColorSwatches label="Color" options={presets} value={presets[0]?.value} onChange={noop} />,
    );
    const red = screen.getByRole('radio', { name: 'Red' });
    expect(getComputedStyle(red).backgroundColor).toBe('rgb(201, 58, 46)');
    expect(getComputedStyle(red).borderTopColor).toBe(tokenColor('--sm-control-border'));
    expect(getComputedStyle(red).boxShadow).toContain(tokenColor('--sm-text'));
    expect(getComputedStyle(screen.getByRole('radio', { name: 'Amber' })).boxShadow).toBe('none');
  });

  it('shows a 12 px color chip', () => {
    const { container } = render(<ColorChip color={'#1f6feb' as Hex} />);
    const chip = container.firstElementChild as HTMLElement;
    expect([box(chip).width, box(chip).height]).toEqual([12, 12]);
    expect(getComputedStyle(chip).backgroundColor).toBe('rgb(31, 111, 235)');
  });
});

function DialogHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Delete?">
        <button type="button">Delete</button>
      </Dialog>
    </>
  );
}

describe('REQ-A11Y-002 REQ-A11Y-003 the dialog is modal, closes on Escape and returns focus', () => {
  it('opens in the top layer with focus inside, and Escape returns focus to the opener', async () => {
    render(<DialogHarness />);
    const opener = screen.getByRole('button', { name: 'Open' });
    await userEvent.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'Delete?' });
    expect(dialog.matches(':modal')).toBe(true);
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});

describe('REQ-THEME-002 the toast floats at the bottom center on the raised surface', () => {
  it('is centered near the bottom of the viewport', () => {
    render(<Toast toast={{ text: 'Saved' }} onDismiss={noop} dismissLabel="Dismiss" />);
    const toast = screen.getByText('Saved').parentElement as HTMLElement;
    const center = box(toast).left + box(toast).width / 2;
    expect(Math.abs(center - innerWidth / 2)).toBeLessThan(2);
    expect(innerHeight - box(toast).bottom).toBeLessThanOrEqual(32);
    expect(getComputedStyle(toast).backgroundColor).toBe(tokenColor('--sm-surface'));
  });
});
