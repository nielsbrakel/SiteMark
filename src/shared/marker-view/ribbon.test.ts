import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { describeElementViewContract } from '../../../tests/unit/element-view-contract';
import {
  addStyles,
  anElementItem,
  aPageItem,
  aViewContext,
  customProperty,
  resetDocument,
} from '../../../tests/unit/marker-view';
import { describeViewContract } from '../../../tests/unit/view-contract';
import type { Corner } from '../../core/model/schema';
import { markerViewCss } from './marker-view-css';
import { createElementRibbonView, createPageRibbonView } from './ribbon';

const pageRibbon = (text = 'PROD', corner: Corner = 'top-right') =>
  aPageItem('ribbon', { text, corner });
const elementRibbon = (text = 'API', corner: Corner = 'top-right') =>
  anElementItem('ribbon', { text, corner });

const textOf = (el: Element) => el.querySelector('.sm-ribbon__text');
const band = (el: Element) => el.querySelector('.sm-ribbon') as HTMLElement;
const dot = (el: Element) => el.querySelector('.sm-ribbon__dot') as HTMLElement;
const box = (width: number, height: number) => ({ left: 0, top: 0, width, height });

describeViewContract('REQ-MARK-002 page ribbon', createPageRibbonView, pageRibbon(), {
  decorative: true,
});
describeViewContract('REQ-MARK-002 element ribbon', createElementRibbonView, elementRibbon(), {
  decorative: true,
});
describeElementViewContract(
  'REQ-MARK-002 element ribbon',
  createElementRibbonView,
  elementRibbon(),
);

describe('REQ-MARK-002 REQ-MARK-015 ribbon view', () => {
  beforeEach(() => addStyles(markerViewCss()));
  afterEach(resetDocument);

  it('always shows its text, inserted as text (REQ-RND-011)', () => {
    const view = createPageRibbonView(pageRibbon('<i>x</i>'), aViewContext());
    expect(textOf(view.el)?.textContent).toBe('<i>x</i>');
    expect(view.el.querySelector('i')).toBeNull();
  });

  it('writes the text in bold uppercase, starting at 12 px', () => {
    const view = createPageRibbonView(pageRibbon('prod'), aViewContext());
    const style = getComputedStyle(textOf(view.el) as Element);
    expect([style.textTransform, style.fontWeight, style.fontSize]).toEqual([
      'uppercase',
      '700',
      '12px',
    ]);
    expect(style.textOverflow).toBe('ellipsis');
  });

  it.each([
    ['top-left', 'top', 'left'],
    ['top-right', 'top', 'right'],
    ['bottom-left', 'bottom', 'left'],
    ['bottom-right', 'bottom', 'right'],
  ] as const)('sits in the %s corner of the viewport', (corner, vertical, horizontal) => {
    const view = createPageRibbonView(pageRibbon('PROD', corner), aViewContext());
    const style = getComputedStyle(band(view.el));
    expect([style.getPropertyValue(vertical), style.getPropertyValue(horizontal)]).toEqual([
      '0px',
      '0px',
    ]);
  });

  it('moves to another corner and text in place', () => {
    const view = createPageRibbonView(pageRibbon(), aViewContext());
    view.update(pageRibbon('ACC', 'bottom-left'));
    expect(textOf(view.el)?.textContent).toBe('ACC');
    expect(getComputedStyle(band(view.el)).bottom).toBe('0px');
  });

  it('becomes a 10 px corner dot on an element whose short side is under 80 px', () => {
    const view = createElementRibbonView(elementRibbon(), aViewContext());
    view.setRect(box(300, 79));
    expect(getComputedStyle(dot(view.el)).display).toBe('block');
    expect(getComputedStyle(band(view.el)).display).toBe('none');
    expect([getComputedStyle(dot(view.el)).width, getComputedStyle(dot(view.el)).height]).toEqual([
      '10px',
      '10px',
    ]);
  });

  it('shows the band again once the short side reaches 80 px', () => {
    const view = createElementRibbonView(elementRibbon(), aViewContext());
    view.setRect(box(300, 60));
    view.setRect(box(300, 80));
    expect(getComputedStyle(dot(view.el)).display).toBe('none');
    expect(getComputedStyle(band(view.el)).display).not.toBe('none');
  });

  it.each([
    [80, '16px'],
    [200, '24px'],
    [1000, '28px'],
  ])('sizes the band to 12 %% of a %s px short side, within 16–28 px (%s)', (short, bandPx) => {
    const view = createElementRibbonView(elementRibbon(), aViewContext());
    view.setRect(box(short + 50, short));
    expect(customProperty(view.el, '--sm-ribbon-band')).toBe(bandPx);
  });

  it('clips the element ribbon to the target box', () => {
    const view = createElementRibbonView(elementRibbon(), aViewContext());
    view.setRect(box(300, 200));
    expect(getComputedStyle(view.el).overflow).toBe('hidden');
  });
});
