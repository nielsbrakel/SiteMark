import { type AST, RegExpParser, visitRegExpAST } from '@eslint-community/regexpp';
import type { RegexErrorCode } from '../errors';
import { err, ok, type Result } from '../result';
import { memoize } from './memo';
import { regexCost } from './regex-cost';

const MAX_LENGTH = 500;
/** Worst-case backtracking steps of one `test` (see regex-cost.ts). */
const MAX_STEPS = 10_000_000;
/** The flags are fixed by the code (REQ-URL-004): unicode mode, nothing else. */
const FLAGS = 'u';
/** ES2024 = the syntax every supported browser runs (D-241), e.g. no `(?i:…)` modifiers yet. */
const parser = new RegExpParser({ ecmaVersion: 2024 });

function parse(source: string): AST.Pattern | undefined {
  try {
    const pattern = parser.parsePattern(source, 0, source.length, { unicode: true });
    new RegExp(source, FLAGS); // the engine must agree with the parser
    return pattern;
  } catch {
    return undefined;
  }
}

/**
 * Backreferences, lookaround, and anything but a single character, class or fixed sequence inside a
 * repeating quantifier (max > 1): no nested quantifiers (star height ≤ 1) and no alternation.
 */
function hasUnsafeSyntax(pattern: AST.Pattern): boolean {
  let unsafe = false;
  let repeating = 0;
  visitRegExpAST(pattern, {
    onBackreferenceEnter: () => {
      unsafe = true;
    },
    onAssertionEnter: (node) => {
      if (node.kind === 'lookahead' || node.kind === 'lookbehind') unsafe = true;
    },
    onAlternativeEnter: (node) => {
      if (repeating > 0 && node.parent.alternatives.length > 1) unsafe = true;
    },
    onQuantifierEnter: (node) => {
      if (repeating > 0) unsafe = true;
      if (node.max > 1) repeating++;
    },
    onQuantifierLeave: (node) => {
      if (node.max > 1) repeating--;
    },
  });
  return unsafe;
}

/**
 * Validates a regex source against the safe subset (REQ-URL-004, D-211): ≤ 500 characters, parses
 * with the fixed flags, no backreferences, no lookaround, no nested quantifiers (star height ≤ 1).
 * Returns the source unchanged when it is safe.
 */
export function validateRegex(source: string): Result<string, RegexErrorCode> {
  if (source.length > MAX_LENGTH) return err('regexTooLong');
  const pattern = source === '' ? undefined : parse(source);
  if (!pattern) return err('regexInvalid');
  if (hasUnsafeSyntax(pattern) || regexCost(pattern) > MAX_STEPS) return err('regexUnsafe');
  return ok(source);
}

/** Compiles a stored regex with the fixed flags, or `undefined` when it isn't in the safe subset. */
export const compileRegex = memoize((source: string): RegExp | undefined =>
  validateRegex(source).ok ? new RegExp(source, FLAGS) : undefined,
);
