import { notImplemented } from '../../core/not-implemented';
import type { EffectView, PageItemOf, ViewContext } from './effect-view';

type BannerItem = PageItemOf<'banner'>;

/** A bar on the top or bottom edge with the merged text, exposed as a note (REQ-MARK-005). */
export function createBannerView(_item: BannerItem, _ctx: ViewContext): EffectView<BannerItem> {
  return notImplemented();
}
