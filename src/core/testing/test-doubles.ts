import type { Clock, IdGen, MarkId, PatternId, SiteGroupId } from '../ids';

/** A Clock that only moves when a test says so. */
export type FixedClock = Clock & { advance(ms: number): void };

/** 2026-01-01T00:00:00Z */
const DEFAULT_START = Date.UTC(2026, 0, 1);

/** `counter('mark')` → `mark00000001`, `mark00000002`, … (always 12 characters). */
function counter(prefix: string): () => string {
  let count = 0;
  return () => {
    count += 1;
    return `${prefix}${String(count).padStart(12 - prefix.length, '0')}`;
  };
}

/**
 * A deterministic IdGen for tests: each kind counts from 1 with a readable prefix, e.g.
 * `group0000001`, `mark00000001`, `pattern00001`. Every ID is valid (REQ-SEC-004).
 */
export function fixedIdGen(): IdGen {
  const group = counter('group');
  const mark = counter('mark');
  const pattern = counter('pattern');
  return {
    siteGroupId: () => group() as SiteGroupId,
    markId: () => mark() as MarkId,
    patternId: () => pattern() as PatternId,
  };
}

/** A Clock fixed at `start` (default 2026-01-01T00:00:00Z). */
export function fixedClock(start = DEFAULT_START): FixedClock {
  let now = start;
  return {
    now: () => now,
    advance: (ms) => {
      now += ms;
    },
  };
}
