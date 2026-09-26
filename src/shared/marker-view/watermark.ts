import { notImplemented } from '../../core/not-implemented';
import type { EffectView, PageItemOf, ViewContext } from './effect-view';

type WatermarkItem = PageItemOf<'watermark'>;

/** The text repeated across the viewport, rotated −30°, at 4–12 % (REQ-MARK-008). */
export function createWatermarkView(
  _item: WatermarkItem,
  _ctx: ViewContext,
): EffectView<WatermarkItem> {
  return notImplemented();
}
