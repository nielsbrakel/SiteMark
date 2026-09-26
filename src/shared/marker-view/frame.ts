import { notImplemented } from '../../core/not-implemented';
import type { EffectView, PageItemOf, ViewContext } from './effect-view';

type FrameItem = PageItemOf<'frame'>;

/** A colored border around the viewport, inside the frames of higher priority (REQ-MARK-006). */
export function createFrameView(_item: FrameItem, _ctx: ViewContext): EffectView<FrameItem> {
  return notImplemented();
}
