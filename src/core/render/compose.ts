import type { ElementMark, PageMark, SiteMarkState } from '../model/schema';
import { activeGroups } from '../url/group-match';
import { itemBase, LAYER, type LayeredItem, type RankedMark } from './layers';
import { pageItems } from './page-items';
import type { RenderItem, RenderPlan } from './render-plan';

/** Paint order of one element mark's effects, bottom → top. */
const ELEMENT_EFFECTS = ['stripes', 'tint', 'outline', 'ribbon'] as const;

/** Element marks all render, independently: one item per effect (REQ-GRP-005). */
function elementItems(marks: readonly RankedMark<ElementMark>[]): LayeredItem[] {
  return marks.flatMap(({ mark, rank }) =>
    ELEMENT_EFFECTS.flatMap((effect) => {
      const params = mark.effects[effect];
      if (!params) return [];
      const target = { selector: mark.target.selector };
      // The params type follows from `effect`; TypeScript can't pair the two through the loop.
      const item = { ...itemBase(mark, effect), target, effect, params } as RenderItem;
      return [{ layer: LAYER.element, rank, item }];
    }),
  );
}

const isPage = (ranked: RankedMark): ranked is RankedMark<PageMark> =>
  ranked.mark.target.kind === 'page';
const isElement = (ranked: RankedMark): ranked is RankedMark<ElementMark> =>
  ranked.mark.target.kind === 'element';

/** Bottom → top: by layer, then the lower priority below, then in the order produced. */
function stack(items: readonly LayeredItem[]): RenderItem[] {
  return items
    .map((layered, order) => ({ ...layered, order }))
    .sort((a, b) => a.layer - b.layer || b.rank - a.rank || a.order - b.order)
    .map(({ item }, z) => ({ ...item, z }));
}

/**
 * The render plan for a URL (REQ-GRP-005, D-242): the enabled marks of every active site group,
 * composed by the rules of spec §5.2 and sorted bottom → top.
 */
export function compose(url: string, state: SiteMarkState): RenderPlan {
  const marks: RankedMark[] = activeGroups(state, url)
    .flatMap((group) => group.marks.filter((mark) => mark.enabled))
    .map((mark, rank) => ({ mark, rank }));
  return {
    items: stack([...pageItems(marks.filter(isPage)), ...elementItems(marks.filter(isElement))]),
  };
}
