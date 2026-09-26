import type { EffectView, PageItemOf, ViewContext } from './effect-view';
import { assembleView, createRoot, setPx } from './view-dom';

type FrameItem = PageItemOf<'frame'>;

/** Far more than 50 frames of 16 px: only guards against nonsense. */
const MAX_INSET_PX = 1000;

/**
 * A colored border around the viewport, inside the frames of higher priority (REQ-MARK-006).
 * A real border (not a box-shadow), so it keeps its shape in forced colors.
 */
export function createFrameView(item: FrameItem, ctx: ViewContext): EffectView<FrameItem> {
  const root = createRoot(ctx, 'sm-frame');
  return assembleView(item, ctx, root, {
    render: ({ params }) => {
      setPx(root, 'border-width', params.widthPx, 2, 16);
      for (const side of ['top', 'right', 'bottom', 'left']) {
        setPx(root, side, params.insetPx, 0, MAX_INSET_PX);
      }
    },
  });
}
