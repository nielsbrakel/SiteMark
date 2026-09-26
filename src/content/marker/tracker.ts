import type { ViewRect } from '../../shared/marker-view/effect-view';

/** What the tracker positions: an element view (EffectView's `setRect`). */
export type TrackedView = { setRect(rect: ViewRect | null): void };

/** A view and its resolved target (`undefined` while the target is missing). */
export type TrackEntry = {
  readonly target: Element | undefined;
  readonly view: TrackedView;
};

export type Tracker = {
  /** Replaces the tracked entries. They are positioned in the next animation frame. */
  track(entries: readonly TrackEntry[]): void;
  /** Something may have moved (e.g. a DOM mutation): re-measure in the next frame. */
  invalidate(): void;
  /** Stops every listener, observer and pending frame. */
  dispose(): void;
};

const SCROLL: AddEventListenerOptions = { capture: true, passive: true };
const RESIZE: AddEventListenerOptions = { passive: true };

/**
 * The target's box in viewport coordinates (the host is `position: fixed; inset: 0`), or `null`
 * while it is missing, detached, `display: none` or has no size (REQ-RND-003).
 */
function measure(target: Element | undefined): ViewRect | null {
  if (!target?.isConnected) return null;
  const { left, top, width, height } = target.getBoundingClientRect();
  return width === 0 && height === 0 ? null : { left, top, width, height };
}

/** Reads every box first, then writes: one layout per frame however many views there are. */
function position(entries: readonly TrackEntry[]): void {
  const rects = new Map<Element | undefined, ViewRect | null>();
  for (const { target } of entries) if (!rects.has(target)) rects.set(target, measure(target));
  for (const { target, view } of entries) view.setRect(rects.get(target) ?? null);
}

/**
 * One rAF loop driven by a dirty flag (REQ-RND-003): capture-phase passive scroll listeners
 * (nested scroll containers too), window resize and one ResizeObserver mark it dirty, and the
 * next frame positions every view. Nothing listens while there are no entries (REQ-RND-009).
 */
export function createTracker(win: Window = window): Tracker {
  let entries: readonly TrackEntry[] = [];
  let frame: number | undefined;
  let resizes: ResizeObserver | undefined;

  const flush = () => {
    frame = undefined;
    position(entries);
  };
  const invalidate = () => {
    if (entries.length === 0 || frame !== undefined) return;
    frame = win.requestAnimationFrame(flush);
  };
  const start = () => {
    win.addEventListener('scroll', invalidate, SCROLL);
    win.addEventListener('resize', invalidate, RESIZE);
    return new ResizeObserver(invalidate);
  };
  const stop = () => {
    if (!resizes) return;
    win.removeEventListener('scroll', invalidate, SCROLL);
    win.removeEventListener('resize', invalidate, RESIZE);
    resizes.disconnect();
    resizes = undefined;
    if (frame !== undefined) win.cancelAnimationFrame(frame);
    frame = undefined;
  };
  const observe = (observer: ResizeObserver) => {
    observer.disconnect();
    // The document grows when content above a target loads, which moves the target.
    observer.observe(win.document.documentElement);
    for (const { target } of entries) if (target) observer.observe(target);
  };

  return {
    track(next) {
      entries = next;
      if (entries.length === 0) return stop();
      resizes ??= start();
      observe(resizes);
      invalidate();
    },
    invalidate,
    dispose() {
      entries = [];
      stop();
    },
  };
}
