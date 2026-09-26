import type { ViewContext, ViewRect } from './effect-view';
import { createRoot } from './view-dom';

// Element views draw on their target's box. The tracker (T-095) measures the target and calls
// `setRect`; the view only places itself, with a translate in container coordinates.

/** The decorative root of an element view: hidden until the target is found (REQ-RND-005). */
export function createBoxRoot(ctx: ViewContext, className: string): HTMLElement {
  const root = createRoot(ctx, `sm-box ${className}`);
  root.hidden = true;
  return root;
}

/** Places an element view on its target's box, or hides it while there is none. */
export function placeBox(el: HTMLElement, rect: ViewRect | null): void {
  const values = rect ? [rect.left, rect.top, rect.width, rect.height] : [];
  el.hidden = !rect || !values.every(Number.isFinite);
  if (!rect || el.hidden) return;
  el.style.setProperty('transform', `translate(${rect.left}px, ${rect.top}px)`);
  el.style.setProperty('width', `${Math.max(0, rect.width)}px`);
  el.style.setProperty('height', `${Math.max(0, rect.height)}px`);
}
