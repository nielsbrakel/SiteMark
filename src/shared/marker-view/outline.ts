import { notImplemented } from '../../core/not-implemented';
import type { EffectView, ElementItemOf, ViewContext } from './effect-view';

type OutlineItem = ElementItemOf<'outline'>;

/** A 1–8 px outline around the target, optionally pulsing (REQ-MARK-003, REQ-A11Y-005). */
export function createOutlineView(_item: OutlineItem, _ctx: ViewContext): EffectView<OutlineItem> {
  return notImplemented();
}
