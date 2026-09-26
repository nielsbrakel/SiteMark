import type { EffectView, ElementItemOf, PageItemOf, ViewContext } from './effect-view';
import { createBoxRoot, placeBox } from './element-box';
import { assembleView, createRoot, setOpacity } from './view-dom';

type PageStripesItem = PageItemOf<'stripes'>;
type ElementStripesItem = ElementItemOf<'stripes'>;

/** Diagonal hazard stripes: a 6 px strip along the top, or the whole viewport (REQ-MARK-007). */
export function createPageStripesView(
  item: PageStripesItem,
  ctx: ViewContext,
): EffectView<PageStripesItem> {
  const root = createRoot(ctx, 'sm-stripes');
  return assembleView(item, ctx, root, {
    render: ({ params }) => {
      root.dataset.area = params.area === 'full' ? 'full' : 'edge';
      setOpacity(root, params.opacityPct, 5, 40);
    },
  });
}

/** Diagonal hazard stripes over the target element's box (REQ-MARK-007). */
export function createElementStripesView(
  item: ElementStripesItem,
  ctx: ViewContext,
): EffectView<ElementStripesItem> {
  const root = createBoxRoot(ctx, 'sm-stripes');
  return assembleView(item, ctx, root, {
    render: ({ params }) => setOpacity(root, params.opacityPct, 5, 40),
    setRect: (rect) => placeBox(root, rect),
  });
}
