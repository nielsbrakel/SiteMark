import type { Corner } from '../../core/model/schema';
import type { ViewContext } from './effect-view';
import { createNode } from './view-dom';

// The pieces both ribbon views share: the corner box that clips the band, the band with its
// text, and the font fitting that needs real layout (ribbon.browser.test.ts).

const CORNERS: readonly string[] = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
] satisfies Corner[];

export type RibbonParts = {
  /** The corner box: a square at the corner that clips the band. */
  readonly corner: HTMLElement;
  readonly text: HTMLElement;
};

/** `.sm-ribbon` > `.sm-ribbon__band` > `.sm-ribbon__text`. */
export function createRibbonParts(ctx: ViewContext): RibbonParts {
  const corner = createNode(ctx, 'div', 'sm-ribbon');
  const band = createNode(ctx, 'div', 'sm-ribbon__band');
  const text = createNode(ctx, 'span', 'sm-ribbon__text');
  band.append(text);
  corner.append(band);
  return { corner, text };
}

/** Puts the nodes in a known corner (top-right for anything else). */
export function setCorner(corner: Corner, ...nodes: HTMLElement[]): void {
  const value = CORNERS.includes(corner) ? corner : 'top-right';
  for (const node of nodes) node.dataset.corner = value;
}

/**
 * Shrinks the text from 12 px to 9 px until it fits; past that, CSS cuts it off with an
 * ellipsis (REQ-MARK-002). Without layout (hidden, or no rendering), it stays at 12 px.
 */
export function fitRibbonText(text: HTMLElement): void {
  for (let size = 12; size >= 9; size--) {
    text.style.setProperty('font-size', `${size}px`);
    if (text.scrollWidth <= text.clientWidth) return;
  }
}
