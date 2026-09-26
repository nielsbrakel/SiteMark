import { notImplemented } from '../../core/not-implemented';
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

export function createTracker(_win: Window = window): Tracker {
  return notImplemented();
}
