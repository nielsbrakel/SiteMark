import type { EffectView, ElementItemOf, PageItemOf, ViewContext, ViewRect } from './effect-view';
import { createBoxRoot, placeBox } from './element-box';
import { createRibbonParts, fitRibbonText, setCorner } from './ribbon-parts';
import { assembleView, createNode, createRoot } from './view-dom';

type PageRibbonItem = PageItemOf<'ribbon'>;
type ElementRibbonItem = ElementItemOf<'ribbon'>;

/** Below this short side an element gets a corner dot instead of a band (REQ-MARK-002). */
const DOT_BELOW_PX = 80;

/** A diagonal band with the text across a corner of the viewport (REQ-MARK-002). */
export function createPageRibbonView(
  item: PageRibbonItem,
  ctx: ViewContext,
): EffectView<PageRibbonItem> {
  const root = createRoot(ctx, 'sm-fill');
  const { corner, text } = createRibbonParts(ctx);
  root.append(corner);
  return assembleView(item, ctx, root, {
    render: ({ params }) => {
      setCorner(params.corner, corner);
      text.textContent = params.text;
      fitRibbonText(text);
    },
  });
}

/** The band height on an element: 12 % of its short side, within 16–28 px (design §6). */
function bandPx(rect: ViewRect): number {
  return Math.min(28, Math.max(16, Math.round(Math.min(rect.width, rect.height) * 0.12)));
}

/**
 * A diagonal band across a corner of the target, clipped to its box; a 10 px corner dot when
 * the target's short side is under 80 px (REQ-MARK-002).
 */
export function createElementRibbonView(
  item: ElementRibbonItem,
  ctx: ViewContext,
): EffectView<ElementRibbonItem> {
  const root = createBoxRoot(ctx, 'sm-ribbon-box');
  const { corner, text } = createRibbonParts(ctx);
  const dot = createNode(ctx, 'div', 'sm-ribbon__dot');
  root.append(corner, dot);
  let layout = '';
  const setRect = (rect: ViewRect | null) => {
    placeBox(root, rect);
    if (!rect || root.hidden) return;
    const isSmall = Math.min(rect.width, rect.height) < DOT_BELOW_PX;
    const next = isSmall ? 'dot' : `${bandPx(rect)}px`;
    if (next === layout) return;
    layout = next;
    root.toggleAttribute('data-small', isSmall);
    if (!isSmall) root.style.setProperty('--sm-ribbon-band', next);
    fitRibbonText(text);
  };
  return assembleView(item, ctx, root, {
    render: ({ params }) => {
      setCorner(params.corner, corner, dot);
      text.textContent = params.text;
      fitRibbonText(text);
    },
    setRect,
  });
}
