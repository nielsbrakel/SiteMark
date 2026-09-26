import { resolveTextColor } from '../model/color';
import type { Mark } from '../model/schema';
import type { RenderItem } from './render-plan';

/**
 * Stacking bands, bottom → top (spec §5.2, D-242). Element marks sit above the page wash and
 * below the banner and ribbon, which must stay readable. Title prefix and favicon aren't drawn
 * in the page; they come first.
 */
export const LAYER = {
  document: 0,
  frame: 1,
  stripes: 2,
  watermark: 3,
  tint: 4,
  element: 5,
  banner: 6,
  ribbon: 7,
} as const;

type Layer = (typeof LAYER)[keyof typeof LAYER];

/** A mark with its priority: 0 is the highest (group order, then mark order in the group). */
export type RankedMark<M extends Mark = Mark> = { readonly mark: M; readonly rank: number };

/** An item before stacking: `z` is set once every item is sorted. */
export type LayeredItem = {
  readonly layer: Layer;
  readonly rank: number;
  readonly item: RenderItem;
};

/** The fields every item of one mark shares; `z` is a placeholder until stacking. */
export function itemBase(mark: Mark, effect: string) {
  return {
    key: `${mark.id}:${effect}`,
    markIds: [mark.id],
    color: mark.color,
    textColor: resolveTextColor(mark),
    z: 0,
  };
}
