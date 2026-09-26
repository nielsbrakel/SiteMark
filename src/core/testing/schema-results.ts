import { expect } from 'vitest';
import type { SchemaResult } from '../model/schema';

// Helpers for tests of the model schemas.

/** The issue paths of a failed parse (`[]` when it succeeded). */
export const pathsOf = <T>(result: SchemaResult<T>): string[] =>
  result.ok ? [] : result.error.map((issue) => issue.path);

/** The issue messages of a failed parse (`[]` when it succeeded). */
export const messagesOf = <T>(result: SchemaResult<T>): string[] =>
  result.ok ? [] : result.error.map((issue) => issue.message);

/** The parsed value; fails the test with the issues when the parse failed. */
export const okValue = <T>(result: SchemaResult<T>): T => {
  if (!result.ok) expect.fail(`expected ok, got ${JSON.stringify(result.error)}`);
  return result.value;
};

/** Round-trips through JSON, like data from storage or an import file. */
export const untrusted = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

export const times = <T>(count: number, make: () => T): T[] => Array.from({ length: count }, make);
