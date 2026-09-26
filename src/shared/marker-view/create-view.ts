import { notImplemented } from '../../core/not-implemented';
import type { RenderItem } from '../../core/render/render-plan';
import type { EffectView, ViewContext } from './effect-view';

/**
 * The view for any render item, or `undefined` for the document effects (title prefix and
 * favicon, T-090/T-091), which aren't drawn in the page. The view's `update` takes any drawn
 * item with the same key: when the effect or target kind changes, it swaps its view.
 */
export function createView(_item: RenderItem, _ctx: ViewContext): EffectView | undefined {
  return notImplemented();
}
