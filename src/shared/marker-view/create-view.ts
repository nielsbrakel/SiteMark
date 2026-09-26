import type { RenderItem } from '../../core/render/render-plan';
import { assertNever } from '../../core/result';
import { createBannerView } from './banner';
import type { DrawnItem, EffectView, ViewContext, ViewRect } from './effect-view';
import { createFrameView } from './frame';
import { createOutlineView } from './outline';
import { createElementRibbonView, createPageRibbonView } from './ribbon';
import { createElementStripesView, createPageStripesView } from './stripes';
import { createElementTintView, createPageTintView } from './tint';
import { createWatermarkView } from './watermark';

type PageDrawnItem = Extract<DrawnItem, { target: 'page' }>;
type ElementDrawnItem = Exclude<DrawnItem, { target: 'page' }>;

function isDrawn(item: RenderItem): item is DrawnItem {
  return item.effect !== 'titlePrefix' && item.effect !== 'favicon';
}

/** Items of one kind can update each other's view. */
function kindOf(item: DrawnItem): string {
  return `${item.target === 'page' ? 'page' : 'element'}:${item.effect}`;
}

function createPageView(item: PageDrawnItem, ctx: ViewContext): EffectView {
  switch (item.effect) {
    case 'ribbon':
      return createPageRibbonView(item, ctx);
    case 'banner':
      return createBannerView(item, ctx);
    case 'frame':
      return createFrameView(item, ctx);
    case 'tint':
      return createPageTintView(item, ctx);
    case 'stripes':
      return createPageStripesView(item, ctx);
    case 'watermark':
      return createWatermarkView(item, ctx);
    default:
      return assertNever(item);
  }
}

function createElementView(item: ElementDrawnItem, ctx: ViewContext): EffectView {
  switch (item.effect) {
    case 'ribbon':
      return createElementRibbonView(item, ctx);
    case 'outline':
      return createOutlineView(item, ctx);
    case 'tint':
      return createElementTintView(item, ctx);
    case 'stripes':
      return createElementStripesView(item, ctx);
    default:
      return assertNever(item);
  }
}

function build(item: DrawnItem, ctx: ViewContext): EffectView {
  return item.target === 'page' ? createPageView(item, ctx) : createElementView(item, ctx);
}

/**
 * The view for any render item, or `undefined` for the document effects (title prefix and
 * favicon, T-090/T-091), which aren't drawn in the page. The view's `update` takes any drawn
 * item with the same key: when the effect or target kind changes, it swaps its view.
 */
export function createView(item: RenderItem, ctx: ViewContext): EffectView | undefined {
  if (!isDrawn(item)) return undefined;
  let kind = kindOf(item);
  let view = build(item, ctx);
  let rect: ViewRect | null = null;
  return {
    get el() {
      return view.el;
    },
    update(next) {
      if (kindOf(next) === kind) return view.update(next);
      view.dispose();
      kind = kindOf(next);
      view = build(next, ctx);
      view.setRect(rect);
    },
    setRect(next) {
      rect = next;
      view.setRect(next);
    },
    dispose: () => view.dispose(),
  };
}
