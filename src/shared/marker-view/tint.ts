import { notImplemented } from '../../core/not-implemented';
import type { DrawnItem, EffectView, PageItemOf, ViewContext } from './effect-view';

type PageTintItem = PageItemOf<'tint'>;
type ElementTintItem = Extract<Exclude<DrawnItem, { target: 'page' }>, { effect: 'tint' }>;

/** A wash of the mark color over the viewport, at 3–15 % (REQ-MARK-004). */
export function createPageTintView(
  _item: PageTintItem,
  _ctx: ViewContext,
): EffectView<PageTintItem> {
  return notImplemented();
}

/** A wash of the mark color over the target element's box, at 5–40 % (REQ-MARK-004). */
export function createElementTintView(
  _item: ElementTintItem,
  _ctx: ViewContext,
): EffectView<ElementTintItem> {
  return notImplemented();
}
