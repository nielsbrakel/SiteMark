import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addStyles, aPageItem, aViewContext, resetDocument } from '../../../tests/unit/marker-view';
import { describeViewContract } from '../../../tests/unit/view-contract';
import type { PageItemOf } from './effect-view';
import { createFrameView } from './frame';
import { markerViewCss } from './marker-view-css';

type Params = PageItemOf<'frame'>['params'];

const frame = (params: Partial<Params> = {}) =>
  aPageItem('frame', { widthPx: 4, nesting: 0, insetPx: 0, ...params });

const sides = (style: CSSStyleDeclaration) => [style.top, style.right, style.bottom, style.left];
const borders = (style: CSSStyleDeclaration) => [
  style.borderTopWidth,
  style.borderRightWidth,
  style.borderBottomWidth,
  style.borderLeftWidth,
];

describeViewContract('REQ-MARK-006 frame', createFrameView, frame(), { decorative: true });

describe('REQ-MARK-006 frame view', () => {
  beforeEach(() => addStyles(markerViewCss()));
  afterEach(resetDocument);

  it('draws a solid border of the mark color around the viewport', () => {
    const view = createFrameView(frame({ widthPx: 6 }), aViewContext());
    const style = getComputedStyle(view.el);
    expect(sides(style)).toEqual(['0px', '0px', '0px', '0px']);
    expect(borders(style)).toEqual(['6px', '6px', '6px', '6px']);
    expect(style.borderTopStyle).toBe('solid');
    expect(style.boxShadow).not.toContain('px');
  });

  it('nests inside the frames of higher priority by insetPx', () => {
    const view = createFrameView(frame({ nesting: 2, insetPx: 10 }), aViewContext());
    expect(sides(getComputedStyle(view.el))).toEqual(['10px', '10px', '10px', '10px']);
  });

  it.each([
    [1, '2px'],
    [40, '16px'],
    [Number.NaN, '2px'],
  ])('keeps a width of %s within 2–16 px (%s)', (widthPx, expected) => {
    const view = createFrameView(frame({ widthPx }), aViewContext());
    expect(getComputedStyle(view.el).borderTopWidth).toBe(expected);
  });

  it('applies a new width and inset in place', () => {
    const view = createFrameView(frame(), aViewContext());
    view.update(frame({ widthPx: 12, insetPx: 4 }));
    const style = getComputedStyle(view.el);
    expect(style.borderLeftWidth).toBe('12px');
    expect(style.left).toBe('4px');
  });
});
