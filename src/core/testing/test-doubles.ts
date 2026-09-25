import type { Clock, IdGen } from '../ids';
import { notImplemented } from '../not-implemented';

/** A Clock that only moves when a test says so. */
export type FixedClock = Clock & { advance(ms: number): void };

/**
 * A deterministic IdGen for tests: each kind counts from 1 with a readable prefix, e.g.
 * `group0000001`, `mark00000001`, `pattern00001`. Every ID is valid (REQ-SEC-004).
 */
export function fixedIdGen(): IdGen {
  return notImplemented();
}

/** A Clock fixed at `start` (default 2026-01-01T00:00:00Z). */
export function fixedClock(_start?: number): FixedClock {
  return notImplemented();
}
