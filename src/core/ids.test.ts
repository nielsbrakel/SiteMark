import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  createIdGen,
  type IdGen,
  isValidId,
  type MarkId,
  type PatternId,
  type RandomValues,
  type SiteGroupId,
} from './ids';
import { fixedClock, fixedIdGen } from './testing/test-doubles';

/** Fills each request with consecutive byte values, starting at `start`. */
function counting(start = 0): { source: RandomValues; lengths: number[] } {
  let next = start;
  const lengths: number[] = [];
  const source: RandomValues = (bytes) => {
    lengths.push(bytes.length);
    for (let i = 0; i < bytes.length; i++) bytes[i] = next++ % 256;
    return bytes;
  };
  return { source, lengths };
}

/** A small deterministic PRNG (xorshift32), good enough to spread IDs. */
function xorshift(seed: number): RandomValues {
  let state = seed;
  return (bytes) => {
    for (let i = 0; i < bytes.length; i++) {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      bytes[i] = state & 0xff;
    }
    return bytes;
  };
}

const mintAll = (gen: IdGen): string[] => [gen.siteGroupId(), gen.markId(), gen.patternId()];

describe('REQ-SEC-004 IDs match ^[A-Za-z0-9_-]{12}$', () => {
  it.each(['abcDEF012_-9', 'AAAAAAAAAAAA', '____________', 'constructor1'])('accepts %j', (id) => {
    expect(isValidId(id)).toBe(true);
  });

  it.each([
    '',
    'abcdefghijk',
    'abcdefghijklm',
    'abcdefghijk+',
    'abc/defghijk',
    'abc=defghijk',
    'abcdefghijké',
    'abcdefghijk ',
    'abcdefghijkl\n',
    '‮abcdefghijk',
    '__proto__',
  ])('rejects %j', (id) => {
    expect(isValidId(id)).toBe(false);
  });

  it.each([
    123456789012,
    null,
    undefined,
    {},
    ['abcdefghijkl'],
    { toString: () => 'abcdefghijkl' },
  ])('rejects the non-string %j', (value) => {
    expect(isValidId(value)).toBe(false);
  });

  it('narrows to the kind of ID the caller asks for', () => {
    const input: unknown = 'abcdefghijkl';
    if (isValidId<MarkId>(input)) expectTypeOf(input).toEqualTypeOf<MarkId>();
    expect(isValidId<MarkId>(input)).toBe(true);
  });
});

describe('REQ-SEC-004 createIdGen mints IDs from injected random bytes', () => {
  it('maps each byte to one base64url character', () => {
    expect(createIdGen(counting(0).source).siteGroupId()).toBe('ABCDEFGHIJKL');
    expect(createIdGen(counting(52).source).markId()).toBe('0123456789-_');
  });

  it('uses the low six bits of each byte, so every character is equally likely', () => {
    expect(createIdGen(counting(64).source).patternId()).toBe('ABCDEFGHIJKL');
    expect(createIdGen(counting(244).source).siteGroupId()).toBe('0123456789-_');
  });

  it('asks for 12 fresh bytes per ID', () => {
    const { source, lengths } = counting();
    const ids = mintAll(createIdGen(source));
    expect(lengths).toEqual([12, 12, 12]);
    expect(new Set(ids).size).toBe(3);
  });

  it('mints only valid, distinct IDs of every kind', () => {
    const gen = createIdGen(xorshift(0x5eed));
    const ids = Array.from({ length: 1000 }, () => mintAll(gen)).flat();
    expect(ids.every((id) => isValidId(id))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('brands each kind, so IDs of different kinds do not mix (type level)', () => {
    const gen = createIdGen(xorshift(1));
    expectTypeOf(gen.siteGroupId()).toEqualTypeOf<SiteGroupId>();
    expectTypeOf(gen.markId()).toEqualTypeOf<MarkId>();
    expectTypeOf(gen.patternId()).toEqualTypeOf<PatternId>();
    expectTypeOf<SiteGroupId>().not.toExtend<MarkId>();
    expectTypeOf<string>().not.toExtend<PatternId>();
  });
});

describe('REQ-SEC-004 deterministic IdGen and Clock for tests', () => {
  it('counts each kind of ID from 1 with a readable prefix', () => {
    const ids = fixedIdGen();
    expect([ids.siteGroupId(), ids.siteGroupId()]).toEqual(['group0000001', 'group0000002']);
    expect(ids.markId()).toBe('mark00000001');
    expect(ids.patternId()).toBe('pattern00001');
    expect(ids.markId()).toBe('mark00000002');
  });

  it('mints IDs in the valid format', () => {
    const ids = fixedIdGen();
    const minted = Array.from({ length: 20 }, () => [ids.siteGroupId(), ids.markId()]).flat();
    expect(minted.every((id) => isValidId(id))).toBe(true);
  });

  it('starts every generator from scratch', () => {
    fixedIdGen().siteGroupId();
    expect(fixedIdGen().siteGroupId()).toBe('group0000001');
  });

  it('keeps the clock still until the test advances it', () => {
    const clock = fixedClock();
    expect(new Date(clock.now()).toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(clock.now()).toBe(clock.now());
    clock.advance(1500);
    expect(new Date(clock.now()).toISOString()).toBe('2026-01-01T00:00:01.500Z');
  });

  it('starts at a given time', () => {
    expect(fixedClock(42).now()).toBe(42);
  });
});
