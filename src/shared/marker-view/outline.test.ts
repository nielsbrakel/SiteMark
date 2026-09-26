import { afterEach, describe, expect, it } from 'vitest';
import { describeElementViewContract } from '../../../tests/unit/element-view-contract';
import {
  addStyles,
  anElementItem,
  aViewContext,
  RED,
  resetDocument,
} from '../../../tests/unit/marker-view';
import { describeViewContract } from '../../../tests/unit/view-contract';
import type { ElementItemOf } from './effect-view';
import { markerViewCss } from './marker-view-css';
import { createOutlineView } from './outline';

type Params = ElementItemOf<'outline'>['params'];

const outline = (params: Partial<Params> = {}) =>
  anElementItem('outline', { widthPx: 3, style: 'solid', pulse: false, ...params });

type HappyWindow = { happyDOM: { settings: { device: { prefersReducedMotion: string } } } };

/** Sets the reduced-motion preference before anything computes styles (happy-dom caches them). */
function prefersReducedMotion(value: 'reduce' | 'no-preference'): void {
  (window as unknown as HappyWindow).happyDOM.settings.device.prefersReducedMotion = value;
}

/** A view with the styles applied, placed on a target box. */
function mounted(params: Partial<Params> = {}) {
  addStyles(markerViewCss());
  const view = createOutlineView(outline(params), aViewContext());
  view.setRect({ left: 10, top: 10, width: 100, height: 40 });
  return view;
}

describeViewContract('REQ-MARK-003 outline', createOutlineView, outline(), { decorative: true });
describeElementViewContract('REQ-MARK-003 outline', createOutlineView, outline());

describe('REQ-MARK-003 outline view', () => {
  afterEach(resetDocument);

  it('draws a W px outline in the mark color, 2 px outside the target box', () => {
    const style = getComputedStyle(mounted({ widthPx: 3 }).el);
    expect([style.outlineWidth, style.outlineStyle, style.outlineOffset]).toEqual([
      '3px',
      'solid',
      '2px',
    ]);
    expect(style.outlineColor).toBe(RED);
  });

  it.each(['solid', 'dashed', 'dotted'] as const)('draws a %s line', (lineStyle) => {
    expect(getComputedStyle(mounted({ style: lineStyle }).el).outlineStyle).toBe(lineStyle);
  });

  it.each([
    [0, '1px'],
    [8, '8px'],
    [20, '8px'],
  ])('keeps a width of %s within 1–8 px (%s)', (widthPx, expected) => {
    expect(getComputedStyle(mounted({ widthPx }).el).outlineWidth).toBe(expected);
  });

  it('applies a new width, style and pulse in place', () => {
    const view = mounted();
    view.update(outline({ widthPx: 6, style: 'dotted', pulse: true }));
    const style = getComputedStyle(view.el);
    expect([style.outlineWidth, style.outlineStyle]).toEqual(['6px', 'dotted']);
    expect(style.animation).toContain('1.6s');
  });
});

describe('REQ-MARK-003 REQ-A11Y-005 outline pulse', () => {
  afterEach(() => {
    prefersReducedMotion('no-preference');
    resetDocument();
  });

  it('pulses in a 1.6 s loop when asked to', () => {
    expect(getComputedStyle(mounted({ pulse: true }).el).animation).toMatch(/1\.6s.*infinite/);
  });

  it('stays still without pulse', () => {
    expect(getComputedStyle(mounted({ pulse: false }).el).animation).not.toContain('1.6s');
  });

  it('stays still under prefers-reduced-motion', () => {
    prefersReducedMotion('reduce');
    expect(getComputedStyle(mounted({ pulse: true }).el).animation).not.toContain('1.6s');
  });
});
