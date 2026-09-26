import type { EffectView, ElementItemOf, ViewContext } from './effect-view';
import { createBoxRoot, placeBox } from './element-box';
import { assembleView, setPx } from './view-dom';

type OutlineItem = ElementItemOf<'outline'>;
type LineStyle = OutlineItem['params']['style'];

const LINE_STYLES: readonly string[] = ['solid', 'dashed', 'dotted'] satisfies LineStyle[];

/**
 * A 1–8 px outline 2 px around the target, solid, dashed or dotted, optionally pulsing; the
 * pulse stops under prefers-reduced-motion (REQ-MARK-003, REQ-A11Y-005).
 */
export function createOutlineView(item: OutlineItem, ctx: ViewContext): EffectView<OutlineItem> {
  const root = createBoxRoot(ctx, 'sm-outline');
  return assembleView(item, ctx, root, {
    render: ({ params }) => {
      setPx(root, 'outline-width', params.widthPx, 1, 8);
      root.dataset.style = LINE_STYLES.includes(params.style) ? params.style : 'solid';
      root.toggleAttribute('data-pulse', params.pulse === true);
    },
    setRect: (rect) => placeBox(root, rect),
  });
}
