import type { AST } from '@eslint-community/regexpp';
import { assertNever } from '../result';
import { type CharSet, charSetOf, disjoint, union } from './char-set';

// A worst-case estimate of the backtracking work of one match attempt (REQ-URL-004, D-211). The
// safe subset already bans nested quantifiers and alternation inside a repeat, so the only way to
// explode is combining choices: a repeat that can stop at many places, followed by something that
// can run long and then fail (`\d*\d*$`, `\d+\d{400}x`), or many alternations in a row. The walk goes
// right to left and prices every step together with what follows it (its continuation).

/** What remains to be matched after a step. */
type Continuation = {
  /** Worst-case work to try every way the rest can match. */
  readonly work: number;
  /** Work for the rest to fail on a character outside `first`. */
  readonly probe: number;
  /** The characters the rest can start with. */
  readonly first: CharSet;
  /** Can the rest match without consuming a character? */
  readonly nullable: boolean;
  /** The sets of the single characters the rest must start with (a literal prefix, or empty). */
  readonly prefix: readonly CharSet[];
};

/** A repeat never runs more often than the longest URL a regex is tested against. */
const MAX_INPUT = 2048;
const MAX_PREFIX = 16;
const END: Continuation = { work: 0, probe: 0, first: [], nullable: true, prefix: [] };
/** The continuation of one repeated item, priced on its own. */
const OPEN: Continuation = { work: 0, probe: 0, first: undefined, nullable: true, prefix: [] };

function consume(set: CharSet, next: Continuation): Continuation {
  const prefix = [set, ...next.prefix].slice(0, MAX_PREFIX);
  return { work: 1 + next.work, probe: 1, first: set, nullable: false, prefix };
}

/**
 * The work of trying `next` after each of the `stops` places where a repeat of `item` can stop.
 * Normally every stop runs all of `next`. When `next` fails on its first character wherever the
 * repeat could go on, only the last stop gets further. When the character at `offset` of `next`'s
 * literal prefix can never be an `item`, only the last `offset + 1` stops can get past it.
 */
function triesAfterRepeat(item: Continuation, single: boolean, stops: number, next: Continuation) {
  if (!next.nullable && disjoint(item.first, next.first)) {
    return (stops - 1) * next.probe + next.work;
  }
  const offset = single ? next.prefix.findIndex((set) => disjoint(item.first, set)) : -1;
  if (offset < 0) return stops * next.work;
  return stops * (offset + 1) + Math.min(stops, offset + 1) * next.work;
}

/** Alternatives that start with different characters: at most one of them gets past its start. */
function alternativesCost(alternatives: readonly AST.Alternative[], next: Continuation) {
  const each = alternatives.map((alternative) => sequenceCost(alternative.elements, next));
  const exclusive = each.every(
    (a, i) => !a.nullable && each.every((b, j) => i === j || disjoint(a.first, b.first)),
  );
  const probe = each.reduce((sum, a) => sum + a.probe, 0);
  return {
    work: exclusive
      ? probe + Math.max(...each.map((a) => a.work))
      : each.reduce((sum, a) => sum + a.work, 0),
    probe,
    first: each.reduce<CharSet>((all, a) => union(all, a.first), []),
    nullable: each.some((a) => a.nullable),
    prefix: each.length === 1 ? (each[0]?.prefix ?? []) : [],
  };
}

function sequenceCost(elements: readonly AST.Element[], next: Continuation): Continuation {
  return elements.reduceRight((rest, element) => elementCost(element, rest), next);
}

function optionalCost(body: Continuation, next: Continuation): Continuation {
  return {
    work: body.work + next.work,
    probe: body.probe + next.probe,
    first: union(body.first, next.first),
    nullable: body.nullable || next.nullable,
    prefix: [],
  };
}

/** `x{min,max}` with max > 1: `x` has a single way to match (the safe subset ensures it). */
function repeatCost(node: AST.Quantifier, next: Continuation): Continuation {
  const item = elementCost(node.element, OPEN);
  const single = item.prefix.length === 1 && item.work === 1;
  const most = Math.min(node.max, MAX_INPUT);
  const stops = most - Math.min(node.min, most) + 1;
  const work = most * item.work + triesAfterRepeat(item, single, stops, next);
  if (node.min > 0 && !item.nullable) {
    return { work, probe: item.probe, first: item.first, nullable: false, prefix: [] };
  }
  return {
    work,
    probe: item.probe + next.probe,
    first: union(item.first, next.first),
    nullable: next.nullable,
    prefix: [],
  };
}

function quantifierCost(node: AST.Quantifier, next: Continuation): Continuation {
  if (node.max > 1) return repeatCost(node, next);
  if (node.max === 0) return { ...next, work: 1 + next.work, probe: 1 + next.probe };
  const body = elementCost(node.element, next);
  return node.min === 0 ? optionalCost(body, next) : body;
}

function assertionCost(node: AST.Assertion, next: Continuation): Continuation {
  // `$` only passes at the end of the input: it fails right away wherever a character follows.
  if (node.kind === 'end') {
    return { work: 1 + next.work, probe: 1, first: [], nullable: false, prefix: [] };
  }
  return { ...next, work: 1 + next.work, probe: 1 + next.probe };
}

function elementCost(element: AST.Element, next: Continuation): Continuation {
  switch (element.type) {
    case 'Character':
    case 'CharacterClass':
    case 'CharacterSet':
    case 'ExpressionCharacterClass':
      return consume(charSetOf(element), next);
    case 'Backreference':
      return consume(undefined, next);
    case 'Assertion':
      return assertionCost(element, next);
    case 'Group':
    case 'CapturingGroup':
      return alternativesCost(element.alternatives, next);
    case 'Quantifier':
      return quantifierCost(element, next);
    default:
      return assertNever(element);
  }
}

function isAnchored(pattern: AST.Pattern): boolean {
  return pattern.alternatives.every((alternative) => {
    const first = alternative.elements[0];
    return first?.type === 'Assertion' && first.kind === 'start';
  });
}

/**
 * Worst-case backtracking steps of `test` on a URL of at most 2048 characters: one match attempt
 * per position, or a single one when every alternative starts with `^`. Only meaningful for the
 * safe subset.
 */
export function regexCost(pattern: AST.Pattern): number {
  const attempt = alternativesCost(pattern.alternatives, END).work;
  return isAnchored(pattern) ? attempt : attempt * MAX_INPUT;
}
