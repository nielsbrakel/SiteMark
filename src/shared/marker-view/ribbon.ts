import { notImplemented } from '../../core/not-implemented';
import type { EffectView, ElementItemOf, PageItemOf, ViewContext } from './effect-view';

type PageRibbonItem = PageItemOf<'ribbon'>;
type ElementRibbonItem = ElementItemOf<'ribbon'>;

/** A diagonal band with the text across a corner of the viewport (REQ-MARK-002). */
export function createPageRibbonView(
  _item: PageRibbonItem,
  _ctx: ViewContext,
): EffectView<PageRibbonItem> {
  return notImplemented();
}

/**
 * A diagonal band across a corner of the target, clipped to its box; a 10 px corner dot when
 * the target's short side is under 80 px (REQ-MARK-002).
 */
export function createElementRibbonView(
  _item: ElementRibbonItem,
  _ctx: ViewContext,
): EffectView<ElementRibbonItem> {
  return notImplemented();
}
