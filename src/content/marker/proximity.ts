// Proximity fade (REQ-RND-013, design §5 and §7): ribbons and banners fade while the pointer is
// near, so the page controls underneath stay visible. Marks never take input (REQ-RND-002), so
// the pointer is watched on the window, passively, and measured at most once per frame.

import { notImplemented } from '../../core/not-implemented';

const NEAR_PX = 24;
const FADED_OPACITY = '0.15';
/** The design's proximity fade: 120 ms with the standard easing, 0 ms under reduced motion. */
const TRANSITION = 'opacity 120ms cubic-bezier(0.2, 0.8, 0.2, 1)';

export type ProximityFadeOptions = {
  /**
   * The nodes to fade (the ribbons' corner boxes and the banners), read on every check because
   * views come and go. Each node is measured with `getBoundingClientRect()` and faded itself.
   * Optional: nodes can also be added one by one with `add()`.
   */
  readonly elements?: () => Iterable<HTMLElement>;
  /** Whether the user prefers reduced motion; defaults to the `prefers-reduced-motion` query. */
  readonly reducedMotion?: () => boolean;
};

export type ProximityFade = {
  /**
   * Adds one node (e.g. from the renderer's `onViewMount`); the returned function takes it out
   * again and restores it.
   */
  add(node: HTMLElement): () => void;
  /** Stops listening and restores every faded node. */
  dispose(): void;
};

/**
 * The nodes of a ribbon or banner view to measure and fade: a ribbon's corner box and small-target
 * dot (a page ribbon's root covers the whole viewport), else the view's root (a banner).
 */
export function fadeNodesOf(_viewRoot: HTMLElement): HTMLElement[] {
  return notImplemented();
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Within `NEAR_PX` of the node's box; a node without a box (hidden) is never near. */
function isNear(node: HTMLElement, x: number, y: number): boolean {
  const box = node.getBoundingClientRect();
  if (box.width === 0 && box.height === 0) return false;
  return (
    x >= box.left - NEAR_PX &&
    x <= box.right + NEAR_PX &&
    y >= box.top - NEAR_PX &&
    y <= box.bottom + NEAR_PX
  );
}

type Point = { readonly x: number; readonly y: number };

/** The nodes near the pointer; none while the pointer is outside the window. */
function nearNodes(nodes: Iterable<HTMLElement>, pointer: Point | undefined): Set<HTMLElement> {
  const near = new Set<HTMLElement>();
  if (!pointer) return near;
  for (const node of nodes) if (isNear(node, pointer.x, pointer.y)) near.add(node);
  return near;
}

/**
 * Fades the nodes near the pointer. Reduced motion turns off the animation (REQ-A11Y-005), not
 * the fade itself: the fade keeps page controls usable, so it happens instantly instead.
 */
export function createProximityFade(options: ProximityFadeOptions): ProximityFade {
  const reducedMotion = options.reducedMotion ?? prefersReducedMotion;
  let pointer: Point | undefined;
  let faded = new Set<HTMLElement>();
  let frame = 0;

  const setFaded = (node: HTMLElement, isFaded: boolean) => {
    node.style.setProperty('transition', reducedMotion() ? 'none' : TRANSITION);
    if (isFaded) node.style.setProperty('opacity', FADED_OPACITY);
    else node.style.removeProperty('opacity');
  };
  const check = () => {
    frame = 0;
    const near = nearNodes(options.elements?.() ?? [], pointer);
    for (const node of faded) if (!near.has(node)) setFaded(node, false);
    for (const node of near) if (!faded.has(node)) setFaded(node, true);
    faded = near;
  };
  const onMove = (event: PointerEvent) => {
    pointer = { x: event.clientX, y: event.clientY };
    frame ||= requestAnimationFrame(check);
  };
  const onOut = (event: PointerEvent) => {
    if (event.relatedTarget !== null) return;
    pointer = undefined;
    cancelAnimationFrame(frame);
    check();
  };

  window.addEventListener('pointermove', onMove, { capture: true, passive: true });
  document.addEventListener('pointerout', onOut, { capture: true, passive: true });
  return {
    add: () => notImplemented(),
    dispose() {
      window.removeEventListener('pointermove', onMove, { capture: true });
      document.removeEventListener('pointerout', onOut, { capture: true });
      cancelAnimationFrame(frame);
      for (const node of faded) {
        node.style.removeProperty('opacity');
        node.style.removeProperty('transition');
      }
      faded.clear();
    },
  };
}
