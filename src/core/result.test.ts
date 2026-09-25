import { describe, expect, expectTypeOf, it } from 'vitest';
import type { ErrorCode } from './errors';
import { assertNever, err, ok, type Result } from './result';

type Edge = 'top' | 'bottom';

function describeEdge(edge: Edge): string {
  switch (edge) {
    case 'top':
      return 'above';
    case 'bottom':
      return 'below';
    default:
      return assertNever(edge);
  }
}

function parsePercent(input: string): Result<number, ErrorCode> {
  const value = Number(input);
  return Number.isInteger(value) ? ok(value) : err('patternInvalidPort');
}

describe('REQ-URL-003 core returns typed results instead of throwing', () => {
  it('wraps a value in ok()', () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 });
  });

  it('wraps a typed error code in err()', () => {
    expect(err('patternEmpty')).toEqual({ ok: false, error: 'patternEmpty' });
  });

  it('narrows on the ok flag', () => {
    const result = parsePercent('x');
    expect(result.ok).toBe(false);
    if (result.ok) expectTypeOf(result.value).toEqualTypeOf<number>();
    else expect(result.error).toBe('patternInvalidPort');
  });

  it('keeps the error type of err() for inference', () => {
    expectTypeOf(err('patternEmpty' as const).error).toEqualTypeOf<'patternEmpty'>();
    expectTypeOf(ok('a').value).toEqualTypeOf<string>();
  });
});

describe('REQ-URL-003 exhaustive switches end in assertNever', () => {
  it('lets every member of the union through', () => {
    expect(describeEdge('top')).toBe('above');
    expect(describeEdge('bottom')).toBe('below');
  });

  it('throws on a value outside the union, naming it', () => {
    expect(() => describeEdge('left' as Edge)).toThrow(/Unexpected value: "left"/);
  });
});
