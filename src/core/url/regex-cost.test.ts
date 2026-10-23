import { RegExpParser } from '@eslint-community/regexpp';
import { describe, expect, it } from 'vitest';
import { regexCost } from './regex-cost';

// The cost model prices worst-case backtracking steps (D-211). These values pin the model itself, so a
// change to it is deliberate: each row says what the number is made of.
describe('REQ-URL-004 regex cost model: worst-case steps of one match attempt', () => {
  it.each([
    ['^a', 4, 'anchored: one step per atom plus the anchor and the end'],
    ['^abc', 6, 'two more atoms, two more steps'],
    ['a', 4096, 'unanchored: one attempt per position of a 2048-character URL'],
    ['^a$', 5, 'the end anchor adds a step'],
    ['^\\bx', 6, 'a word boundary is a step too'],
    ['^a{0}b', 6, 'a repeat of zero still costs its step'],
    ['^a?b', 7, 'an optional atom is tried both ways'],
    ['^a{2,4}b', 10, 'a bounded repeat can stop at three places'],
    ['^(?:ab|cd)(?:ef|gh)', 12, 'alternatives with different starts: one gets past its start'],
    ['^(?:a|a)b', 8, 'alternatives with the same start are both tried'],
    ['^a*b', 4101, 'a repeat that fails on the next literal: only the last stop goes on'],
    ['^\\d+x$', 4100, 'the same, with a trailing anchor'],
    ['^\\d+\\d{400}x', 823299, 'overlapping repeats multiply'],
    ['^\\d*\\d*$', 8396806, 'two overlapping stars are quadratic'],
    ['(\\w)\\1', 8192, 'a backreference may match anything'],
  ])('%s costs %i (%s)', (source, steps) => {
    expect(regexCost(new RegExpParser().parsePattern(source))).toBe(steps);
  });
});
