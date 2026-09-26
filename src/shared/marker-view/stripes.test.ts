import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { describeElementViewContract } from '../../../tests/unit/element-view-contract';
import {
  addStyles,
  anElementItem,
  aPageItem,
  aViewContext,
  RED,
  resetDocument,
} from '../../../tests/unit/marker-view';
import { describeViewContract } from '../../../tests/unit/view-contract';
import type { PageItemOf } from './effect-view';
import { markerViewCss } from './marker-view-css';
import { createElementStripesView, createPageStripesView } from './stripes';

type Area = PageItemOf<'stripes'>['params']['area'];

const pageStripes = (area: Area = 'edge', opacityPct = 20) =>
  aPageItem('stripes', { area, opacityPct });
const elementStripes = (opacityPct = 20) => anElementItem('stripes', { opacityPct });

const HAZARD = `repeating-linear-gradient(-45deg, ${RED} 0 12px, transparent 12px 24px)`;
const sides = (style: CSSStyleDeclaration) => [style.top, style.right, style.bottom, style.left];

describeViewContract('REQ-MARK-007 page stripes', createPageStripesView, pageStripes(), {
  decorative: true,
});
describeViewContract('REQ-MARK-007 element stripes', createElementStripesView, elementStripes(), {
  decorative: true,
});
describeElementViewContract(
  'REQ-MARK-007 element stripes',
  createElementStripesView,
  elementStripes(),
);

describe('REQ-MARK-007 stripes view', () => {
  beforeEach(() => addStyles(markerViewCss()));
  afterEach(resetDocument);

  it('edge: draws a 6 px strip along the top of the viewport', () => {
    const view = createPageStripesView(pageStripes('edge'), aViewContext());
    const style = getComputedStyle(view.el);
    expect([style.top, style.right, style.left, style.height]).toEqual([
      '0px',
      '0px',
      '0px',
      '6px',
    ]);
  });

  it('full: covers the viewport', () => {
    const view = createPageStripesView(pageStripes('full'), aViewContext());
    expect(sides(getComputedStyle(view.el))).toEqual(['0px', '0px', '0px', '0px']);
  });

  it.each([
    ['page', () => createPageStripesView(pageStripes('full'), aViewContext())],
    ['element', () => createElementStripesView(elementStripes(), aViewContext())],
  ])('draws a diagonal hazard pattern in the mark color (%s)', (_target, create) => {
    expect(getComputedStyle(create().el).backgroundImage).toBe(HAZARD);
  });

  it.each([
    [2, '0.05'],
    [20, '0.2'],
    [80, '0.4'],
  ])('keeps an opacity of %s %% within 5–40 %% (%s)', (opacityPct, expected) => {
    const page = createPageStripesView(pageStripes('edge', opacityPct), aViewContext());
    const element = createElementStripesView(elementStripes(opacityPct), aViewContext());
    expect(getComputedStyle(page.el).opacity).toBe(expected);
    expect(getComputedStyle(element.el).opacity).toBe(expected);
  });

  it('switches area and opacity in place', () => {
    const view = createPageStripesView(pageStripes('edge'), aViewContext());
    view.update(pageStripes('full', 10));
    const style = getComputedStyle(view.el);
    expect(style.bottom).toBe('0px');
    expect(style.opacity).toBe('0.1');
  });
});
