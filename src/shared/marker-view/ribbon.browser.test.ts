import { afterEach, describe, expect, it } from 'vitest';
import { centerOf, mountViewHost } from '../../../tests/browser/marker-view-host';
import { anElementItem, aPageItem } from '../../../tests/unit/marker-view';
import type { Corner } from '../../core/model/schema';
import { createElementRibbonView, createPageRibbonView } from './ribbon';

const pageRibbon = (text: string, corner: Corner = 'top-right') =>
  aPageItem('ribbon', { text, corner });
const elementRibbon = (corner: Corner = 'top-right') =>
  anElementItem('ribbon', { text: 'API', corner });

const part = (el: Element, name: string) => el.querySelector(`.sm-ribbon${name}`) as HTMLElement;
const fontPx = (el: Element) => Number.parseFloat(getComputedStyle(el).fontSize);
const fits = (el: HTMLElement) => el.scrollWidth <= el.clientWidth;

describe('REQ-MARK-002 page ribbon layout', () => {
  afterEach(() => document.body.replaceChildren());

  it.each([
    ['top-left', 45, 45],
    ['top-right', innerWidth - 45, 45],
    ['bottom-left', 45, innerHeight - 45],
    ['bottom-right', innerWidth - 45, innerHeight - 45],
  ] as const)('crosses the %s corner diagonally', (corner, x, y) => {
    const view = createPageRibbonView(pageRibbon('PROD', corner), mountViewHost());
    const band = part(view.el, '__band');
    expect(band.offsetWidth).toBe(180);
    expect(band.offsetHeight).toBe(32);
    expect(Math.abs(new DOMMatrix(getComputedStyle(band).transform).b)).toBeCloseTo(Math.SQRT1_2);
    const center = centerOf(band);
    expect(center.x).toBeCloseTo(x, 0);
    expect(center.y).toBeCloseTo(y, 0);
  });

  it('keeps a short text at 12 px', () => {
    const view = createPageRibbonView(pageRibbon('PROD'), mountViewHost());
    const text = part(view.el, '__text');
    expect(fontPx(text)).toBe(12);
    expect(fits(text)).toBe(true);
  });

  it('shrinks the text from 12 px down to 9 px to fit, then cuts it off with an ellipsis', () => {
    const host = mountViewHost();
    const sizes = Array.from({ length: 16 }, (_, i) => {
      const view = createPageRibbonView(pageRibbon('W'.repeat(i + 1)), host);
      const text = part(view.el, '__text');
      const size = fontPx(text);
      expect(size).toBeGreaterThanOrEqual(9);
      expect(size).toBeLessThanOrEqual(12);
      if (size > 9) expect(fits(text)).toBe(true);
      view.dispose();
      return size;
    });
    expect(sizes).toEqual([...sizes].sort((a, b) => b - a));
    expect(sizes.some((size) => size > 9 && size < 12)).toBe(true);
    expect(sizes.at(-1)).toBe(9);
  });

  it('cuts off 16 wide characters with an ellipsis', () => {
    const view = createPageRibbonView(pageRibbon('W'.repeat(16)), mountViewHost());
    const text = part(view.el, '__text');
    expect(fits(text)).toBe(false);
    expect(getComputedStyle(text).textOverflow).toBe('ellipsis');
  });
});

describe('REQ-MARK-002 element ribbon layout', () => {
  afterEach(() => document.body.replaceChildren());

  it('draws the band in the corner of the target, clipped to its box', () => {
    const view = createElementRibbonView(elementRibbon('bottom-left'), mountViewHost());
    view.setRect({ left: 100, top: 50, width: 400, height: 200 });
    const band = part(view.el, '__band');
    expect(band.offsetHeight).toBe(24);
    const corner = part(view.el, '').getBoundingClientRect();
    expect([corner.left, corner.bottom]).toEqual([100, 250]);
    const box = view.el.getBoundingClientRect();
    expect([box.left, box.top, box.width, box.height]).toEqual([100, 50, 400, 200]);
    expect(getComputedStyle(view.el).overflow).toBe('hidden');
  });

  it('becomes a 10 px dot in the corner of a small target', () => {
    const view = createElementRibbonView(elementRibbon('top-right'), mountViewHost());
    view.setRect({ left: 100, top: 50, width: 300, height: 40 });
    const dot = part(view.el, '__dot').getBoundingClientRect();
    expect([dot.width, dot.height]).toEqual([10, 10]);
    expect(dot.right).toBeLessThanOrEqual(400);
    expect(dot.right).toBeGreaterThan(390);
    expect(dot.top).toBeGreaterThanOrEqual(50);
    expect(dot.top).toBeLessThan(60);
    expect(part(view.el, '__band').getBoundingClientRect().width).toBe(0);
  });
});
