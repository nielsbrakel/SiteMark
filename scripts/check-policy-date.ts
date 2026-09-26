// Policy date check (REQ-POLICY-004): a pull request that changes PRIVACY*.md must also move its
// "Last updated" date forward. CI runs it on pull requests (the `policy-date` job).
//   node scripts/check-policy-date.ts <base> <head>
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** A changed file: its text at the base and at the head (undefined when it doesn't exist there). */
export type PolicyChange = { file: string; before: string | undefined; after: string | undefined };

const POLICY_FILE = /^PRIVACY(\.[a-z]{2})?\.md$/;
const DATE_LINE = /^(?:Last updated|Laatst bijgewerkt): (\d{4}-\d{2}-\d{2})$/m;

/** PRIVACY.md and its translations (PRIVACY.<locale>.md) at the repository root. */
export function isPolicyFile(file: string): boolean {
  return POLICY_FILE.test(file);
}

/** The date of the `Last updated: YYYY-MM-DD` (or Dutch `Laatst bijgewerkt:`) line. */
export function lastUpdated(text: string): string | undefined {
  return text.match(DATE_LINE)?.[1];
}

/** 2026-02-30 isn't a day: the date must survive a round trip through Date. */
const isRealDate = (date: string) =>
  !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().startsWith(date);

function problemOf({ file, before, after }: PolicyChange): string | undefined {
  if (after === undefined) {
    return `${file} was deleted, but the website and the store listings need it`;
  }
  const date = lastUpdated(after);
  if (date === undefined) return `${file} has no "Last updated: YYYY-MM-DD" line`;
  if (!isRealDate(date)) return `${file}: the "Last updated" date ${date} is not a real date`;
  const previous = before === undefined ? undefined : lastUpdated(before);
  if (previous === undefined || before === after) return undefined;
  if (date === previous) return `${file} changed, but its "Last updated" date is still ${date}`;
  if (date < previous) {
    return `${file}: the "Last updated" date ${date} is before the previous ${previous}`;
  }
  return undefined;
}

/** What's wrong with the changed policy files; empty when every date moved forward. */
export function policyDateProblems(changes: readonly PolicyChange[]): string[] {
  return changes
    .filter((change) => isPolicyFile(change.file))
    .flatMap((change) => problemOf(change) ?? []);
}

function main([base = '', head = '']: string[]): void {
  if (!base || !head) {
    console.error('usage: node scripts/check-policy-date.ts <base> <head>');
    process.exit(2);
  }
  // Quiet: `git show` of a file that doesn't exist at a commit is expected (a new or deleted file).
  const git = (...args: string[]) =>
    execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const at = (ref: string, file: string) => {
    try {
      return git('show', `${ref}:${file}`);
    } catch {
      return undefined; // the file doesn't exist at that commit
    }
  };
  const from = git('merge-base', base, head).trim();
  const files = git('diff', '--name-only', '--no-renames', from, head).split('\n').filter(Boolean);
  const changes = files.filter(isPolicyFile).map((file) => ({
    file,
    before: at(from, file),
    after: at(head, file),
  }));
  const problems = policyDateProblems(changes);
  for (const problem of problems) console.error(`✗ ${problem}`);
  if (problems.length) process.exit(1);
  console.log(`✓ ${changes.length} changed policy file(s) with an updated date`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
