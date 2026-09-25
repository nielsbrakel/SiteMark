import type { MarkId } from '../ids';
import type { ElementEffects, Hex, PageEffects } from '../model/schema';
import { notImplemented } from '../not-implemented';

// The render plan: the ONLY data a content script receives (D-221). Plain JSON, no functions,
// nothing the tab doesn't need to draw its marks. Built by compose() in the background.

type Params<Effects, K extends keyof Effects> = Required<Effects>[K];

/** An effect on the page, with its settings from the mark (spec §7). */
export type PageEffectItem =
  | { readonly effect: 'ribbon'; readonly params: Params<PageEffects, 'ribbon'> }
  /** Banners on the same edge are merged: texts joined with ` · `, the first banner's style. */
  | { readonly effect: 'banner'; readonly params: Params<PageEffects, 'banner'> }
  /**
   * Frames nest: `nesting` 0 is the outermost (highest priority), and `insetPx` is the total
   * width of the frames outside this one.
   */
  | {
      readonly effect: 'frame';
      readonly params: Params<PageEffects, 'frame'> & {
        readonly nesting: number;
        readonly insetPx: number;
      };
    }
  | { readonly effect: 'tint'; readonly params: Params<PageEffects, 'tint'> }
  | { readonly effect: 'stripes'; readonly params: Params<PageEffects, 'stripes'> }
  | { readonly effect: 'watermark'; readonly params: Params<PageEffects, 'watermark'> }
  | { readonly effect: 'titlePrefix'; readonly params: Params<PageEffects, 'titlePrefix'> }
  | { readonly effect: 'favicon'; readonly params: Params<PageEffects, 'favicon'> };

/** An effect on the first element that matches the selector (REQ-RND-005). */
export type ElementEffectItem =
  | { readonly effect: 'ribbon'; readonly params: Params<ElementEffects, 'ribbon'> }
  | { readonly effect: 'outline'; readonly params: Params<ElementEffects, 'outline'> }
  | { readonly effect: 'tint'; readonly params: Params<ElementEffects, 'tint'> }
  | { readonly effect: 'stripes'; readonly params: Params<ElementEffects, 'stripes'> };

type ItemBase = {
  /**
   * Stable across plans (keyed diff, REQ-RND-007): `${markId}:${effect}`, or `banner:top` and
   * `banner:bottom` for the merged banners.
   */
  readonly key: string;
  /** The marks this item draws: one, or every merged banner in priority order. */
  readonly markIds: readonly MarkId[];
  readonly color: Hex;
  /** Already resolved (`auto` → black or white, REQ-MARK-011). */
  readonly textColor: Hex;
  /**
   * Stacking order, bottom → top, equal to the item's index in the plan: frame < stripes <
   * watermark < tint < element marks < banner < ribbon (D-242); within an effect, the higher
   * priority is on top. Title prefix and favicon come first; they aren't drawn in the page.
   */
  readonly z: number;
};

export type RenderItem =
  | (ItemBase & { readonly target: 'page' } & PageEffectItem)
  | (ItemBase & { readonly target: { readonly selector: string } } & ElementEffectItem);

export type RenderPlan = {
  /** Sorted by `z`. Empty when no site group is active: the tab does nothing (REQ-RND-009). */
  readonly items: readonly RenderItem[];
};

/** The plan of a tab with no active site group, and the starting point of a tab's diff. */
export function emptyPlan(): RenderPlan {
  return notImplemented();
}
