import { afterEach, describe, expect, it } from 'vitest';
import { addStyles, aPageItem, aViewContext, resetDocument } from '../../../tests/unit/marker-view';
import { describeViewContract } from '../../../tests/unit/view-contract';
import { createBannerView } from './banner';
import type { PageItemOf } from './effect-view';
import { markerViewCss } from './marker-view-css';

type Params = PageItemOf<'banner'>['params'];

const banner = (params: Partial<Params> = {}) => {
  const full: Params = { text: 'PROD · EU', edge: 'top', size: 'compact', ...params };
  return aPageItem('banner', full, { key: `banner:${full.edge}` });
};

const textOf = (el: Element) => el.querySelector('.sm-banner__text');

/** The chevron; an assertion (not a TypeError) when it's missing. */
function chevronOf(el: Element): HTMLButtonElement {
  const button = el.querySelector('button');
  expect(button).toBeInstanceOf(HTMLButtonElement);
  return button as HTMLButtonElement;
}

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

describe('REQ-MARK-005 REQ-A11Y-002 banner collapse chevron', () => {
  afterEach(resetDocument);

  it('is a keyboard-focusable button that says what it does', () => {
    const view = createBannerView(banner(), aViewContext());
    const chevron = chevronOf(view.el);
    expect(chevron.type).toBe('button');
    expect(chevron.tabIndex).toBe(0);
    expect(chevron.getAttribute('aria-label')).toBe('Collapse banner');
    expect(chevron.getAttribute('aria-expanded')).toBe('true');
    chevron.focus();
    expect(document.activeElement).toBe(chevron);
  });

  it('takes pointer input while the bar lets it through (REQ-RND-002)', () => {
    addStyles(markerViewCss());
    const view = createBannerView(banner(), aViewContext());
    expect(getComputedStyle(view.el).pointerEvents).toBe('none');
    expect(getComputedStyle(chevronOf(view.el)).pointerEvents).toBe('auto');
  });

  it('collapses the banner to a 24 × 24 tab at the end of its edge', () => {
    addStyles(markerViewCss());
    const view = createBannerView(banner({ edge: 'bottom', size: 'regular' }), aViewContext());
    const chevron = chevronOf(view.el);
    chevron.click();
    const style = getComputedStyle(view.el);
    expect([style.width, style.height, style.right, style.bottom]).toEqual([
      '24px',
      '24px',
      '0px',
      '0px',
    ]);
    expect(style.left).not.toBe('0px');
    expect(getComputedStyle(textOf(view.el) as Element).display).toBe('none');
    expect(chevron.getAttribute('aria-expanded')).toBe('false');
    expect(chevron.getAttribute('aria-label')).toBe('Show banner');
  });

  it('expands again on the next activation', () => {
    addStyles(markerViewCss());
    const view = createBannerView(banner(), aViewContext());
    chevronOf(view.el).click();
    chevronOf(view.el).click();
    expect(getComputedStyle(view.el).height).toBe('24px');
    expect(getComputedStyle(view.el).left).toBe('0px');
    expect(chevronOf(view.el).getAttribute('aria-expanded')).toBe('true');
  });

  it('collapses only that banner', () => {
    const ctx = aViewContext();
    const top = createBannerView(banner(), ctx);
    const bottom = createBannerView(banner({ edge: 'bottom' }), ctx);
    chevronOf(top.el).click();
    expect([...ctx.collapsedBanners]).toEqual(['banner:top']);
    expect(chevronOf(bottom.el).getAttribute('aria-expanded')).toBe('true');
  });

  it('stays collapsed when a new plan updates the banner', () => {
    const view = createBannerView(banner(), aViewContext());
    chevronOf(view.el).click();
    view.update(banner({ text: 'PROD · EU · US' }));
    expect(chevronOf(view.el).getAttribute('aria-expanded')).toBe('false');
  });

  it('stays collapsed for the life of the document, across re-mounts (SPA navigation)', () => {
    const ctx = aViewContext();
    const first = createBannerView(banner(), ctx);
    chevronOf(first.el).click();
    first.dispose();
    const again = createBannerView(banner(), ctx);
    expect(chevronOf(again.el).getAttribute('aria-expanded')).toBe('false');
    expect(aViewContext().collapsedBanners.size).toBe(0);
  });
});
