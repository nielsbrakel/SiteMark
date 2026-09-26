import { describe, expect, it } from 'vitest';
import { createRateLimiter } from './rate-limit';

function limiter(max = 3, windowMs = 1000) {
  let time = 0;
  const limit = createRateLimiter(max, windowMs, () => time);
  return {
    limit,
    at(ms: number) {
      time = ms;
      return limit;
    },
  };
}

describe('REQ-SEC-006 sliding-window rate limiter for host repairs', () => {
  it('allows max takes within the window and refuses the next', () => {
    const { limit } = limiter();
    expect([limit.tryTake(), limit.tryTake(), limit.tryTake(), limit.tryTake()]).toEqual([
      true,
      true,
      true,
      false,
    ]);
  });

  it('reports 0 ms while a slot is free, else the time until the oldest take expires', () => {
    const { limit, at } = limiter();
    expect(limit.msUntilNext()).toBe(0);
    at(100).tryTake();
    at(300).tryTake();
    at(400).tryTake();
    expect(at(500).msUntilNext()).toBe(600);
  });

  it('frees one slot as each take leaves the window', () => {
    const { at } = limiter();
    at(0).tryTake();
    at(500).tryTake();
    at(600).tryTake();
    expect(at(999).tryTake()).toBe(false);
    expect(at(1000).tryTake()).toBe(true);
    expect(at(1001).tryTake()).toBe(false);
    expect(at(1500).tryTake()).toBe(true);
  });

  it('does not count refused attempts', () => {
    const { at } = limiter(1);
    at(0).tryTake();
    for (let ms = 1; ms < 1000; ms += 100) at(ms).tryTake();
    expect(at(1000).tryTake()).toBe(true);
  });
});
