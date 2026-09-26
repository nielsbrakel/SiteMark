import { notImplemented } from '../../core/not-implemented';

export type RateLimiter = {
  /** Takes a slot if fewer than `max` were taken in the last `windowMs`. */
  tryTake(): boolean;
  /** Milliseconds until a slot frees up; 0 when one is free now. */
  msUntilNext(): number;
};

/** A sliding-window limiter: at most `max` takes per `windowMs` (REQ-SEC-006: 10 per 10 s). */
export function createRateLimiter(
  _max: number,
  _windowMs: number,
  _now: () => number,
): RateLimiter {
  return notImplemented();
}
