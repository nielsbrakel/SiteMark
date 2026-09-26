import type { AST } from '@eslint-community/regexpp';
import { assertNever } from '../result';

/**
 * A set of code points as inclusive ranges, or `undefined` when it isn't known exactly (Unicode
 * properties). Used by the regex cost estimate to see whether two steps can match the same
 * character; an unknown set overlaps everything.
 */
export type CharSet = readonly (readonly [number, number])[] | undefined;

type Ranges = readonly (readonly [number, number])[];

const MAX_CODE_POINT = 0x10ffff;
const DIGIT: Ranges = [[0x30, 0x39]];
const WORD: Ranges = [
  [0x30, 0x39],
  [0x41, 0x5a],
  [0x5f, 0x5f],
  [0x61, 0x7a],
];
const SPACE: Ranges = [
  [0x09, 0x0d],
  [0x20, 0x20],
  [0xa0, 0xa0],
  [0x1680, 0x1680],
  [0x2000, 0x200a],
  [0x2028, 0x2029],
  [0x202f, 0x202f],
  [0x205f, 0x205f],
  [0x3000, 0x3000],
  [0xfeff, 0xfeff],
];
const LINE_TERMINATORS: Ranges = [
  [0x0a, 0x0a],
  [0x0d, 0x0d],
  [0x2028, 0x2029],
];

/** The complement of a set of ranges within all code points. */
function complement(set: CharSet): CharSet {
  if (!set) return undefined;
  const sorted = [...set].sort((a, b) => a[0] - b[0]);
  const result: [number, number][] = [];
  let next = 0;
  for (const [from, to] of sorted) {
    if (from > next) result.push([next, from - 1]);
    next = Math.max(next, to + 1);
  }
  if (next <= MAX_CODE_POINT) result.push([next, MAX_CODE_POINT]);
  return result;
}

export function union(a: CharSet, b: CharSet): CharSet {
  return a && b ? [...a, ...b] : undefined;
}

/** Can no character be in both sets? Unknown sets overlap everything. */
export function disjoint(a: CharSet, b: CharSet): boolean {
  if (!a || !b) return false;
  return a.every(([from, to]) => b.every(([min, max]) => to < min || max < from));
}

function escapeSet(node: AST.EscapeCharacterSet | AST.UnicodePropertyCharacterSet): CharSet {
  switch (node.kind) {
    case 'digit':
      return node.negate ? complement(DIGIT) : DIGIT;
    case 'word':
      return node.negate ? complement(WORD) : WORD;
    case 'space':
      return node.negate ? complement(SPACE) : SPACE;
    case 'property':
      return undefined;
    default:
      return assertNever(node);
  }
}

function classElementSet(element: AST.CharacterClassElement): CharSet {
  switch (element.type) {
    case 'Character':
      return [[element.value, element.value]];
    case 'CharacterClassRange':
      return [[element.min.value, element.max.value]];
    case 'CharacterSet':
      return escapeSet(element);
    default:
      return undefined; // `v`-flag syntax, which the fixed flags never parse
  }
}

function classSet(node: AST.CharacterClass): CharSet {
  const elements = node.elements as readonly AST.CharacterClassElement[];
  const set = elements.reduce<CharSet>((all, element) => union(all, classElementSet(element)), []);
  return node.negate ? complement(set) : set;
}

/** The characters a single-character node can match (`.` stops at line terminators). */
export function charSetOf(
  node: AST.Character | AST.CharacterClass | AST.CharacterSet | AST.ExpressionCharacterClass,
): CharSet {
  switch (node.type) {
    case 'Character':
      return [[node.value, node.value]];
    case 'CharacterClass':
      return classSet(node);
    case 'CharacterSet':
      return node.kind === 'any' ? complement(LINE_TERMINATORS) : escapeSet(node);
    case 'ExpressionCharacterClass':
      return undefined;
    default:
      return assertNever(node);
  }
}
