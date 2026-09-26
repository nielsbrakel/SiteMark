import type { DrawnItem, EffectView, ViewContext, ViewRect } from './effect-view';

// DOM helpers every view shares. User text only ever reaches the page through `textContent`;
// colors only as validated hex through `style.setProperty`; every other style value is a number
// the view computed itself (REQ-RND-011).

const HEX = /^#[0-9a-f]{6}$/;

/** A `<tag class="…">` in the container's document. */
export function createNode<K extends keyof HTMLElementTagNameMap>(
  ctx: ViewContext,
  tag: K,
  className: string,
): HTMLElementTagNameMap[K] {
  const node = ctx.container.ownerDocument.createElement(tag);
  node.className = className;
  return node;
}

/** A view's outermost node; decorative overlays are hidden from assistive technology. */
export function createRoot(ctx: ViewContext, className: string, decorative = true): HTMLElement {
  const root = createNode(ctx, 'div', `sm-view ${className}`);
  if (decorative) root.setAttribute('aria-hidden', 'true');
  return root;
}

/** Sets a color custom property to a validated hex value, or removes it. */
function setColor(el: HTMLElement, name: string, value: string): void {
  if (HEX.test(value)) el.style.setProperty(name, value);
  else el.style.removeProperty(name);
}

/** `value` limited to `min…max`; `min` when it isn't a finite number. */
function clamp(value: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
}

/** Sets a length in whole pixels, limited to `min…max`. */
export function setPx(
  el: HTMLElement,
  name: string,
  value: number,
  min: number,
  max: number,
): void {
  el.style.setProperty(name, `${Math.round(clamp(value, min, max))}px`);
}

/** What a view adds to the shared behaviour of `assembleView`. */
type ViewParts<I extends DrawnItem> = {
  /** Applies an item's own settings (colors and z are already set). */
  readonly render: (item: I) => void;
  readonly setRect?: (rect: ViewRect | null) => void;
};

/**
 * Appends `root` to the container, then renders `item` (so views can measure). Colors and z
 * come from every item; `render` handles the rest.
 */
export function assembleView<I extends DrawnItem>(
  item: I,
  ctx: ViewContext,
  root: HTMLElement,
  parts: ViewParts<I>,
): EffectView<I> {
  const apply = (next: I) => {
    setColor(root, '--sm-mark-color', next.color);
    setColor(root, '--sm-mark-text', next.textColor);
    root.style.setProperty('z-index', String(Math.trunc(clamp(next.z, 0, 1e6))));
    parts.render(next);
  };
  ctx.container.append(root);
  apply(item);
  return {
    el: root,
    update: apply,
    setRect: parts.setRect ?? (() => undefined),
    dispose: () => root.remove(),
  };
}
