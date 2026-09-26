import { afterEach, describe, expect, it } from 'vitest';
import {
  anElementItem,
  aPageItem,
  aViewContext,
  resetDocument,
} from '../../../tests/unit/marker-view';
import type { RenderItem } from '../../core/render/render-plan';
import { createView } from './create-view';
import type { DrawnItem, EffectView } from './effect-view';

const RECT = { left: 1, top: 2, width: 300, height: 200 };

const drawn: [string, DrawnItem, string][] = [
  ['page ribbon', aPageItem('ribbon', { text: 'PROD', corner: 'top-left' }), '.sm-ribbon'],
  ['banner', aPageItem('banner', { text: 'PROD', edge: 'top', size: 'compact' }), '.sm-banner'],
  ['frame', aPageItem('frame', { widthPx: 4, nesting: 0, insetPx: 0 }), '.sm-frame'],
  ['page tint', aPageItem('tint', { opacityPct: 10 }), '.sm-tint'],
  ['page stripes', aPageItem('stripes', { opacityPct: 10, area: 'edge' }), '.sm-stripes'],
  ['watermark', aPageItem('watermark', { text: 'PROD', opacityPct: 8 }), '.sm-watermark'],
  ['element ribbon', anElementItem('ribbon', { text: 'API', corner: 'top-left' }), '.sm-ribbon'],
  [
    'outline',
    anElementItem('outline', { widthPx: 2, style: 'solid', pulse: false }),
    '.sm-outline',
  ],
  ['element tint', anElementItem('tint', { opacityPct: 20 }), '.sm-tint'],
  ['element stripes', anElementItem('stripes', { opacityPct: 20 }), '.sm-stripes'],
];

/** The view for `item`; an assertion (not a TypeError) when there is none. */
function viewOf(item: RenderItem, ctx = aViewContext()): EffectView {
  const view = createView(item, ctx);
  expect(view).toBeDefined();
  return view as EffectView;
}

const matches = (el: Element, selector: string) =>
  el.matches(selector) || el.querySelector(selector) !== null;

describe('REQ-MARK-002 REQ-MARK-003 REQ-MARK-004 REQ-MARK-005 REQ-MARK-006 REQ-MARK-007 REQ-MARK-008 createView', () => {
  afterEach(resetDocument);

  it.each(drawn)('draws a %s', (_name, item, selector) => {
    const ctx = aViewContext();
    const view = viewOf(item, ctx);
    expect([...ctx.container.children]).toEqual([view.el]);
    expect(matches(view.el, selector)).toBe(true);
    expect(view.el.hidden).toBe(item.target !== 'page');
  });

  it.each([
    { ...aPageItem('tint', { opacityPct: 5 }), effect: 'titlePrefix', params: { text: '[P]' } },
    { ...aPageItem('tint', { opacityPct: 5 }), effect: 'favicon', params: {} },
  ] as RenderItem[])('leaves the $effect document effect to DocumentEffects', (item) => {
    const ctx = aViewContext();
    expect(createView(item, ctx)).toBeUndefined();
    expect(ctx.container.children).toHaveLength(0);
  });

  it('updates the same kind of view in place', () => {
    const view = viewOf(aPageItem('tint', { opacityPct: 5 }));
    const first = view.el;
    view.update(aPageItem('tint', { opacityPct: 9 }));
    expect(view.el).toBe(first);
    expect(view.el.style.opacity).toBe('0.09');
  });

  it('swaps its view when a mark moves between page and element, keeping the rect', () => {
    const ctx = aViewContext();
    const view = viewOf(aPageItem('tint', { opacityPct: 5 }), ctx);
    view.setRect(RECT);
    view.update(anElementItem('tint', { opacityPct: 20 }));
    expect([...ctx.container.children]).toEqual([view.el]);
    expect(view.el.classList.contains('sm-box')).toBe(true);
    expect(view.el.hidden).toBe(false);
    expect(view.el.style.width).toBe('300px');
  });

  it('removes whatever it drew on dispose', () => {
    const ctx = aViewContext();
    const view = viewOf(
      anElementItem('outline', { widthPx: 2, style: 'dotted', pulse: true }),
      ctx,
    );
    view.update(anElementItem('tint', { opacityPct: 20 }));
    view.dispose();
    expect(ctx.container.children).toHaveLength(0);
  });
});
