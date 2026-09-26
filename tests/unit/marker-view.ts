import type { MarkId } from '../../src/core/ids';
import type { Hex } from '../../src/core/model/schema';
import type { DrawnItem, PageItemOf, ViewContext } from '../../src/shared/marker-view/effect-view';

// Test support for the shared marker views (src/shared/marker-view): render items and a view
// context with a container in the document. Used by the dom and the browser tests.

type Effect = DrawnItem['effect'];
type ElementItemOf<E extends Effect> = Extract<
  Exclude<DrawnItem, { target: 'page' }>,
  { effect: E }
>;
type BaseOverrides = Partial<Pick<DrawnItem, 'key' | 'markIds' | 'color' | 'textColor' | 'z'>>;

export const RED = '#c93a2e' as Hex;
export const WHITE = '#ffffff' as Hex;
export const BLUE = '#1f6feb' as Hex;

const MARK = 'mark00000001' as MarkId;

function base(effect: Effect, overrides: BaseOverrides) {
  return {
    key: `${MARK}:${effect}`,
    markIds: [MARK],
    color: RED,
    textColor: WHITE,
    z: 3,
    ...overrides,
  };
}

/** A page item of one effect, red with white text. */
export function aPageItem<E extends Effect>(
  effect: E,
  params: PageItemOf<E>['params'],
  overrides: BaseOverrides = {},
): PageItemOf<E> {
  return { ...base(effect, overrides), target: 'page', effect, params } as PageItemOf<E>;
}

/** An element item of one effect on `#app`, red with white text. */
export function anElementItem<E extends Effect>(
  effect: E,
  params: ElementItemOf<E>['params'],
  overrides: BaseOverrides = {},
): ElementItemOf<E> {
  const target = { selector: '#app' };
  return { ...base(effect, overrides), target, effect, params } as ElementItemOf<E>;
}

/** A context whose container is a fresh `<div>` in `root` (the document body by default). */
export function aViewContext(root: Node = document.body): ViewContext {
  const container = document.createElement('div');
  root.appendChild(container);
  return {
    container,
    collapsedBanners: new Set(),
    labels: { collapseBanner: 'Collapse banner', expandBanner: 'Show banner' },
  };
}

/** Adds the views' static styles to the document, so happy-dom computes them. */
export function addStyles(css: string): void {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
}

/** Removes everything the tests added to the document. */
export function resetDocument(): void {
  document.head.replaceChildren();
  document.body.replaceChildren();
}

/** An inline custom property of `el`, e.g. `--sm-mark-color`. */
export function customProperty(el: Element, name: string): string {
  return (el as HTMLElement).style.getPropertyValue(name).trim();
}
