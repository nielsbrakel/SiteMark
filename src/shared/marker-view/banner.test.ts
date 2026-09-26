import { afterEach, describe, expect, it } from 'vitest';
import { addStyles, aPageItem, aViewContext, resetDocument } from '../../../tests/unit/marker-view';
import { describeViewContract } from '../../../tests/unit/view-contract';
import { createBannerView } from './banner';
import type { PageItemOf } from './effect-view';
import { markerViewCss } from './marker-view-css';

type Params = PageItemOf<'banner'>['params'];

const banner = (params: Partial<Params> = {}) =>
  aPageItem(
    'banner',
    { text: 'PROD · EU', edge: 'top', size: 'compact', ...params },
    {
      key: 'banner:top',
    },
  );

const textOf = (el: Element) => el.querySelector('.sm-banner__text');

describeViewContract('REQ-MARK-005 banner', createBannerView, banner(), { decorative: false });

describe('REQ-MARK-005 REQ-A11Y-006 banner view', () => {
  afterEach(resetDocument);

  it('exposes the merged text to assistive technology as a note', () => {
    const view = createBannerView(banner(), aViewContext());
    expect(view.el.getAttribute('role')).toBe('note');
    expect(textOf(view.el)?.textContent).toBe('PROD · EU');
  });

  it('inserts the text as text, never as markup (REQ-RND-011)', () => {
    const view = createBannerView(banner({ text: '<img src=x onerror=alert(1)>' }), aViewContext());
    expect(textOf(view.el)?.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(view.el.querySelector('img')).toBeNull();
  });

  it('hides its glyph from assistive technology', () => {
    const view = createBannerView(banner(), aViewContext());
    const glyph = view.el.querySelector('.sm-banner__glyph');
    expect(glyph?.getAttribute('aria-hidden')).toBe('true');
  });

  it.each([
    ['top', 'compact', 'top', '24px'],
    ['bottom', 'regular', 'bottom', '36px'],
  ] as const)('sits on the %s edge, %s: %s 0, %s high', (edge, size, side, height) => {
    addStyles(markerViewCss());
    const view = createBannerView(banner({ edge, size }), aViewContext());
    const style = getComputedStyle(view.el);
    expect(style.height).toBe(height);
    expect(style.getPropertyValue(side)).toBe('0px');
    expect([style.left, style.right]).toEqual(['0px', '0px']);
  });

  it('applies a new text, edge and size in place', () => {
    addStyles(markerViewCss());
    const ctx = aViewContext();
    const view = createBannerView(banner(), ctx);
    view.update(banner({ text: 'ACC', edge: 'bottom', size: 'regular' }));
    expect(ctx.container.children).toHaveLength(1);
    expect(textOf(view.el)?.textContent).toBe('ACC');
    expect(getComputedStyle(view.el).height).toBe('36px');
    expect(getComputedStyle(view.el).bottom).toBe('0px');
  });
});
