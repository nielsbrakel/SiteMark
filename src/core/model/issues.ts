import type { core, ZodType } from 'zod';
import { err, ok } from '../result';
import type { SchemaIssue, SchemaResult } from './schema';

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** `['siteGroups', 2, 'marks', 0, 'text']` → `siteGroups[2].marks[0].text`; the root is `''`. */
function formatPath(path: readonly PropertyKey[]): string {
  return path
    .map((key, index) => {
      if (typeof key === 'number') return `[${key}]`;
      const name = String(key);
      if (!IDENTIFIER.test(name)) return `[${JSON.stringify(name)}]`;
      return index === 0 ? name : `.${name}`;
    })
    .join('');
}

function toSchemaIssue(issue: core.$ZodIssue): SchemaIssue {
  return { path: formatPath(issue.path), message: issue.message };
}

/** Runs `schema` on untrusted input; never throws (D-225). */
export function parseWith<T>(schema: ZodType<T>, input: unknown): SchemaResult<T> {
  const result = schema.safeParse(input);
  return result.success ? ok(result.data) : err(result.error.issues.map(toSchemaIssue));
}
