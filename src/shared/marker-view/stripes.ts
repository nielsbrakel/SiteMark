import { notImplemented } from '../../core/not-implemented';
import type { EffectView, ElementItemOf, PageItemOf, ViewContext } from './effect-view';

type PageStripesItem = PageItemOf<'stripes'>;
type ElementStripesItem = ElementItemOf<'stripes'>;

/** Diagonal hazard stripes: a 6 px strip along the top, or the whole viewport (REQ-MARK-007). */
export function createPageStripesView(
  _item: PageStripesItem,
  _ctx: ViewContext,
): EffectView<PageStripesItem> {
  return notImplemented();
}

/** Diagonal hazard stripes over the target element's box (REQ-MARK-007). */
export function createElementStripesView(
  _item: ElementStripesItem,
  _ctx: ViewContext,
): EffectView<ElementStripesItem> {
  return notImplemented();
}
