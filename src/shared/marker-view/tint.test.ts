import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { describeElementViewContract } from '../../../tests/unit/element-view-contract';
import {
  addStyles,
  anElementItem,
  aPageItem,
  aViewContext,
  resetDocument,
} from '../../../tests/unit/marker-view';
import { describeViewContract } from '../../../tests/unit/view-contract';
import { markerViewCss } from './marker-view-css';
import { createElementTintView, createPageTintView } from './tint';

const pageTint = (opacityPct = 10) => aPageItem('tint', { opacityPct });
const elementTint = (opacityPct = 25) => anElementItem('tint', { opacityPct });

describeViewContract('REQ-MARK-004 page tint', createPageTintView, pageTint(), {
  decorative: true,
});
describeViewContract('REQ-MARK-004 element tint', createElementTintView, elementTint(), {
  decorative: true,
});
describeElementViewContract('REQ-MARK-004 element tint', createElementTintView, elementTint());

describe('REQ-MARK-004 tint view', () => {
  beforeEach(() => addStyles(markerViewCss()));
  afterEach(resetDocument);

  it('covers the viewport in the mark color at the page opacity', () => {
    const view = createPageTintView(pageTint(12), aViewContext());
    const style = getComputedStyle(view.el);
    expect([style.top, style.right, style.bottom, style.left]).toEqual([
      '0px',
      '0px',
      '0px',
      '0px',
    ]);
    expect(style.opacity).toBe('0.12');
  });

  it.each([
    [1, '0.03'],
    [3, '0.03'],
    [15, '0.15'],
    [60, '0.15'],
  ])('keeps a page tint of %s %% within 3–15 %% (%s)', (opacityPct, expected) => {
    const view = createPageTintView(pageTint(opacityPct), aViewContext());
    expect(getComputedStyle(view.el).opacity).toBe(expected);
  });

  it.each([
    [1, '0.05'],
    [40, '0.4'],
    [90, '0.4'],
  ])('keeps an element tint of %s %% within 5–40 %% (%s)', (opacityPct, expected) => {
    const view = createElementTintView(elementTint(opacityPct), aViewContext());
    expect(getComputedStyle(view.el).opacity).toBe(expected);
  });

  it('applies a new opacity in place', () => {
    const page = createPageTintView(pageTint(), aViewContext());
    page.update(pageTint(5));
    const element = createElementTintView(elementTint(), aViewContext());
    element.update(elementTint(30));
    expect(getComputedStyle(page.el).opacity).toBe('0.05');
    expect(getComputedStyle(element.el).opacity).toBe('0.3');
  });
});
