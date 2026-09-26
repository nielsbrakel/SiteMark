// Policy date check (REQ-POLICY-004): a pull request that changes PRIVACY*.md must also move its
// "Last updated" date forward.
//   node scripts/check-policy-date.ts <base> <head>
import { notImplemented } from '../src/core/not-implemented.ts';

/** A changed file: its text at the base and at the head (undefined when it doesn't exist there). */
export type PolicyChange = { file: string; before: string | undefined; after: string | undefined };

/** PRIVACY.md and its translations (PRIVACY.<locale>.md) at the repository root. */
export function isPolicyFile(_file: string): boolean {
  return notImplemented();
}

/** The date of the `Last updated: YYYY-MM-DD` (or Dutch `Laatst bijgewerkt:`) line. */
export function lastUpdated(_text: string): string | undefined {
  return notImplemented();
}

/** What's wrong with the changed policy files; empty when every date moved forward. */
export function policyDateProblems(_changes: readonly PolicyChange[]): string[] {
  return notImplemented();
}
