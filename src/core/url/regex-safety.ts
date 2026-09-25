import { type AST, RegExpParser, visitRegExpAST } from '@eslint-community/regexpp';
import type { RegexErrorCode } from '../errors';
import { err, ok, type Result } from '../result';
import { memoize } from './memo';

const MAX_LENGTH = 500;
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
 * Backreferences, lookaround, or a quantifier inside a repeating quantifier (max > 1): the
 * constructs that make a backtracking engine slow (star height ≤ 1).
 */
function isUnsafe(pattern: AST.Pattern): boolean {
  let unsafe = false;
  let repeating = 0;
  visitRegExpAST(pattern, {
    onBackreferenceEnter: () => {
      unsafe = true;
    },
    onAssertionEnter: (node) => {
      if (node.kind === 'lookahead' || node.kind === 'lookbehind') unsafe = true;
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
  return isUnsafe(pattern) ? err('regexUnsafe') : ok(source);
}

/** Compiles a stored regex with the fixed flags, or `undefined` when it isn't in the safe subset. */
export const compileRegex = memoize((source: string): RegExp | undefined =>
  validateRegex(source).ok ? new RegExp(source, FLAGS) : undefined,
);
