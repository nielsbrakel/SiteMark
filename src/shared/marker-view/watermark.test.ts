import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addStyles, aPageItem, aViewContext, resetDocument } from '../../../tests/unit/marker-view';
import { describeViewContract } from '../../../tests/unit/view-contract';
import { markerViewCss } from './marker-view-css';
import { createWatermarkView } from './watermark';

const watermark = (text = 'PRODUCTION', opacityPct = 8) =>
  aPageItem('watermark', { text, opacityPct });

const rowsOf = (el: Element) => [...el.querySelectorAll('.sm-watermark__row')];
const planeOf = (el: Element) => el.querySelector('.sm-watermark__plane') as HTMLElement;
const count = (haystack: string, needle: string) => haystack.split(needle).length - 1;

describeViewContract('REQ-MARK-008 watermark', createWatermarkView, watermark(), {
  decorative: true,
});

describe('REQ-MARK-008 watermark view', () => {
  beforeEach(() => addStyles(markerViewCss()));
  afterEach(resetDocument);

  it('covers the viewport, clipped to it', () => {
    const view = createWatermarkView(watermark(), aViewContext());
    const style = getComputedStyle(view.el);
    expect([style.top, style.right, style.bottom, style.left]).toEqual([
      '0px',
      '0px',
      '0px',
      '0px',
    ]);
    expect(style.overflow).toBe('hidden');
  });

  it('repeats the text in many rows, each holding it many times', () => {
    const view = createWatermarkView(watermark('ACC'), aViewContext());
    const rows = rowsOf(view.el);
    expect(rows.length).toBeGreaterThanOrEqual(10);
    for (const row of rows) expect(count(row.textContent ?? '', 'ACC')).toBeGreaterThanOrEqual(10);
  });

  it('inserts the text as text only (REQ-RND-011)', () => {
    const view = createWatermarkView(watermark('<b>x</b>'), aViewContext());
    expect(view.el.querySelector('b')).toBeNull();
    const rows = rowsOf(view.el);
    expect(rows.every((row) => row.children.length === 0)).toBe(true);
    expect(rows[0]?.textContent).toContain('<b>x</b>');
  });

  it('rotates the text −30° in 20 px bold', () => {
    const view = createWatermarkView(watermark(), aViewContext());
    const plane = getComputedStyle(planeOf(view.el));
    expect(plane.transform).toContain('rotate(-30deg)');
    expect([plane.fontSize, plane.fontWeight]).toEqual(['20px', '700']);
  });

  it.each([
    [1, '0.04'],
    [8, '0.08'],
    [30, '0.12'],
  ])('keeps an opacity of %s %% within 4–12 %% (%s)', (opacityPct, expected) => {
    const view = createWatermarkView(watermark('PROD', opacityPct), aViewContext());
    expect(getComputedStyle(view.el).opacity).toBe(expected);
  });

  it('replaces the text and opacity in place', () => {
    const view = createWatermarkView(watermark('PROD'), aViewContext());
    view.update(watermark('TEST', 12));
    const rows = rowsOf(view.el);
    expect(rows.every((row) => row.textContent?.includes('TEST'))).toBe(true);
    expect(rows.some((row) => row.textContent?.includes('PROD'))).toBe(false);
    expect(getComputedStyle(view.el).opacity).toBe('0.12');
  });
});
