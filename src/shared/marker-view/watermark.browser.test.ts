import { afterEach, describe, expect, it } from 'vitest';
import { centerOf, mountViewHost } from '../../../tests/browser/marker-view-host';
import { aPageItem } from '../../../tests/unit/marker-view';
import { createWatermarkView } from './watermark';

const watermark = (text: string) => aPageItem('watermark', { text, opacityPct: 8 });

describe('REQ-MARK-008 watermark covers the viewport at −30°', () => {
  afterEach(() => document.body.replaceChildren());

  it.each(['I', 'W'.repeat(24)])('leaves no uncovered corner (%s)', (text) => {
    const view = createWatermarkView(watermark(text), mountViewHost());
    const plane = view.el.querySelector('.sm-watermark__plane') as HTMLElement;
    const diagonal = Math.hypot(innerWidth, innerHeight);
    // A square at least as wide as the diagonal, centered, covers the viewport at any angle.
    expect(plane.offsetWidth).toBeGreaterThanOrEqual(diagonal);
    expect(plane.offsetHeight).toBeGreaterThanOrEqual(diagonal);
    const center = centerOf(plane);
    expect(center.x).toBeCloseTo(innerWidth / 2, 0);
    expect(center.y).toBeCloseTo(innerHeight / 2, 0);
  });

  it.each(['I', 'W'.repeat(24)])('fills the plane with rows of text (%s)', (text) => {
    const view = createWatermarkView(watermark(text), mountViewHost());
    const plane = view.el.querySelector('.sm-watermark__plane') as HTMLElement;
    const rows = [...view.el.querySelectorAll<HTMLElement>('.sm-watermark__row')];
    const height = rows.reduce((sum, row) => sum + row.offsetHeight, 0);
    expect(height).toBeGreaterThanOrEqual(plane.clientHeight);
    for (const row of rows) expect(row.scrollWidth).toBeGreaterThan(plane.clientWidth);
  });
});
