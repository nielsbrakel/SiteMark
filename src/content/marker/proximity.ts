import { notImplemented } from '../../core/not-implemented';

export type ProximityFadeOptions = {
  /**
   * The nodes to fade (the ribbons' corner boxes and the banners), read on every check because
   * views come and go. Each node is measured with `getBoundingClientRect()` and faded itself.
   */
  readonly elements: () => Iterable<HTMLElement>;
  /** Whether the user prefers reduced motion; defaults to the `prefers-reduced-motion` query. */
  readonly reducedMotion?: () => boolean;
};

export type ProximityFade = {
  /** Stops listening and restores every faded node. */
  dispose(): void;
};

export function createProximityFade(_options: ProximityFadeOptions): ProximityFade {
  return notImplemented();
}
