import type { EffectView, ElementItemOf, PageItemOf, ViewContext } from './effect-view';
import { createBoxRoot, placeBox } from './element-box';
import { assembleView, createRoot, setOpacity } from './view-dom';

type PageTintItem = PageItemOf<'tint'>;
type ElementTintItem = ElementItemOf<'tint'>;

/** A wash of the mark color over the viewport, at 3–15 % (REQ-MARK-004). */
export function createPageTintView(item: PageTintItem, ctx: ViewContext): EffectView<PageTintItem> {
  const root = createRoot(ctx, 'sm-fill sm-tint');
  return assembleView(item, ctx, root, {
    render: ({ params }) => setOpacity(root, params.opacityPct, 3, 15),
  });
}

/** A wash of the mark color over the target element's box, at 5–40 % (REQ-MARK-004). */
export function createElementTintView(
  item: ElementTintItem,
  ctx: ViewContext,
): EffectView<ElementTintItem> {
  const root = createBoxRoot(ctx, 'sm-tint');
  return assembleView(item, ctx, root, {
    render: ({ params }) => setOpacity(root, params.opacityPct, 5, 40),
    setRect: (rect) => placeBox(root, rect),
  });
}
