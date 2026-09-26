import fc from 'fast-check';
import { expect } from 'vitest';

/** Enough to find the edge cases these generators reach, fast enough for every `pnpm test`. */
const NUM_RUNS = 200;

/**
 * Runs a fast-check property and rethrows the failing run's own error with the (shrunk)
 * counterexample and seed, so a failure reads like any other test failure and can be replayed.
 */
export function assertProperty<T>(property: fc.IProperty<T>, numRuns = NUM_RUNS): void {
  const details = fc.check(property, { numRuns });
  if (!details.failed) return;
  const replay = `seed ${details.seed}, path ${JSON.stringify(details.counterexamplePath)}`;
  const counterexample = `Counterexample: ${fc.stringify(details.counterexample)} (${replay})`;
  const error = details.errorInstance;
  if (error instanceof Error) {
    error.message += `\n${counterexample}`;
    throw error;
  }
  expect.fail(`Property failed. ${counterexample}`);
}
