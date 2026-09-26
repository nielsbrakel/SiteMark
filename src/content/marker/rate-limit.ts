export type RateLimiter = {
  /** Takes a slot if fewer than `max` were taken in the last `windowMs`. */
  tryTake(): boolean;
  /** Milliseconds until a slot frees up; 0 when one is free now. */
  msUntilNext(): number;
};

/** A sliding-window limiter: at most `max` takes per `windowMs` (REQ-SEC-006: 10 per 10 s). */
export function createRateLimiter(max: number, windowMs: number, now: () => number): RateLimiter {
  const taken: number[] = [];
  const prune = (time: number) => {
    while (taken.length > 0 && time - (taken[0] ?? time) >= windowMs) taken.shift();
  };
  return {
    tryTake() {
      const time = now();
      prune(time);
      if (taken.length >= max) return false;
      taken.push(time);
      return true;
    },
    msUntilNext() {
      const time = now();
      prune(time);
      const oldest = taken[0];
      return taken.length < max || oldest === undefined ? 0 : oldest + windowMs - time;
    },
  };
}
