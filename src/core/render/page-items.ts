import type { PageEffects, PageMark } from '../model/schema';
import { itemBase, LAYER, type LayeredItem, type RankedMark } from './layers';
import type { RenderItem } from './render-plan';

// The spec §5.2 composition rules for page marks (REQ-GRP-005, D-242). Marks come in priority
// order; each rule returns its items in that order.

type Ranked = RankedMark<PageMark>;
type WithParams<K extends keyof PageEffects> = Ranked & {
  readonly params: NonNullable<PageEffects[K]>;
};
/** Effects whose params go into the plan as the mark stores them. */
type AsStored = 'ribbon' | 'tint' | 'stripes' | 'watermark' | 'titlePrefix' | 'favicon';

function withEffect<K extends keyof PageEffects>(marks: readonly Ranked[], effect: K) {
  return marks.flatMap((ranked): WithParams<K>[] => {
    const params = ranked.mark.effects[effect];
    return params ? [{ ...ranked, params }] : [];
  });
}

function asStored<K extends AsStored>(effect: K, layer: LayeredItem['layer']) {
  return ({ mark, rank, params }: WithParams<K>): LayeredItem => {
    // The params type follows from K; TypeScript can't pair a generic K with its union member.
    const item = { ...itemBase(mark, effect), target: 'page', effect, params } as RenderItem;
    return { layer, rank, item };
  };
}

/** One banner per edge: texts joined with ` · `, the first banner's colors and size. */
function banners(marks: readonly Ranked[]): LayeredItem[] {
  return (['top', 'bottom'] as const).flatMap((edge) => {
    const onEdge = withEffect(marks, 'banner').filter(({ params }) => params.edge === edge);
    const [first] = onEdge;
    if (!first) return [];
    const item: RenderItem = {
      ...itemBase(first.mark, 'banner'),
      key: `banner:${edge}`,
      markIds: onEdge.map(({ mark }) => mark.id),
      target: 'page',
      effect: 'banner',
      params: { ...first.params, text: onEdge.map(({ params }) => params.text).join(' · ') },
    };
    return [{ layer: LAYER.banner, rank: first.rank, item }];
  });
}

/** Nested frames: the highest priority is outermost. */
function frames(marks: readonly Ranked[]): LayeredItem[] {
  let insetPx = 0;
  return withEffect(marks, 'frame').map(({ mark, rank, params }, nesting) => {
    const item: RenderItem = {
      ...itemBase(mark, 'frame'),
      target: 'page',
      effect: 'frame',
      params: { ...params, nesting, insetPx },
    };
    insetPx += params.widthPx;
    return { layer: LAYER.frame, rank, item };
  });
}

/** One ribbon per corner, for the highest priority. */
function ribbons(marks: readonly Ranked[]): LayeredItem[] {
  const taken = new Set<string>();
  const firstPerCorner = withEffect(marks, 'ribbon').filter(({ params }) => {
    const isFirst = !taken.has(params.corner);
    taken.add(params.corner);
    return isFirst;
  });
  return firstPerCorner.map(asStored('ribbon', LAYER.ribbon));
}

export function pageItems(marks: readonly Ranked[]): LayeredItem[] {
  return [
    // Title prefix and favicon: the highest priority only.
    ...withEffect(marks, 'titlePrefix').slice(0, 1).map(asStored('titlePrefix', LAYER.document)),
    ...withEffect(marks, 'favicon').slice(0, 1).map(asStored('favicon', LAYER.document)),
    ...frames(marks),
    // Tint, stripes and watermark: all of them, layered by priority.
    ...withEffect(marks, 'stripes').map(asStored('stripes', LAYER.stripes)),
    ...withEffect(marks, 'watermark').map(asStored('watermark', LAYER.watermark)),
    ...withEffect(marks, 'tint').map(asStored('tint', LAYER.tint)),
    ...banners(marks),
    ...ribbons(marks),
  ];
}
