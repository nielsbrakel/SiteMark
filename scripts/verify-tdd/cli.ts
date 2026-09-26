// verify-tdd (D-210): replays every red → green round of a commit range.
//   node scripts/verify-tdd/cli.ts <base> <head>
// For each round: red came first, red only touched tests/stubs/test infrastructure, the red commit's
// tests fail (only on assertions or NotImplementedError), and the same tests pass at green.
// Runs in a temporary git worktree, so the working copy is untouched.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, globSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { type Outcome, playwrightOutcome, vitestOutcome } from './outcome.ts';
import {
  type Commit,
  pairRounds,
  type Round,
  redScopeViolations,
  type TestFiles,
  testFilesOf,
} from './rounds.ts';

const [base = '', head = ''] = process.argv.slice(2);
if (!base || !head) {
  console.error('usage: node scripts/verify-tdd/cli.ts <base> <head>');
  process.exit(2);
}

const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const lines = (text: string) => text.split('\n').filter(Boolean);

function commitsIn(range: string): Commit[] {
  return lines(git('rev-list', '--reverse', '--no-merges', range)).map((sha) => ({
    sha,
    subject: git('log', '-1', '--format=%s', sha),
    files: lines(git('diff-tree', '--no-commit-id', '--name-only', '-r', sha)),
  }));
}

function redTasksOn(ref: string): Set<string> {
  const reds = lines(git('log', '--format=%s', ref)).flatMap(
    (subject) => subject.match(/^test\((T-\d{3}(?:,T-\d{3})*)\)!?: red\b/)?.[1]?.split(',') ?? [],
  );
  return new Set(reds);
}

function isStubAt(sha: string): (file: string) => boolean {
  return (file) => {
    try {
      return git('show', `${sha}:${file}`).includes('notImplemented(');
    } catch {
      return false; // deleted in the red commit
    }
  };
}

function run(cwd: string, command: string, args: string[]): number {
  const env = { ...process.env, CI: '1' };
  return spawnSync(command, args, { cwd, env, stdio: 'inherit' }).status ?? 1;
}

/** A Playwright suite: what to build first, its config and where its JSON report goes. */
type PlaywrightSuite = { build: string; config: string; report: string };

const EXTENSION_E2E: PlaywrightSuite = {
  build: 'build:e2e',
  config: 'playwright.config.ts',
  report: 'test-results/playwright.json',
};
// The website e2e runs against `vite preview` of the built website (website/playwright.config.ts).
const WEBSITE_E2E: PlaywrightSuite = {
  build: 'web:build',
  config: 'website/playwright.config.ts',
  report: 'test-results/playwright-website.json',
};

function runVitest(worktree: string, files: string[]): Outcome {
  if (files.some((file) => file.startsWith('tests/build/'))) run(worktree, 'pnpm', ['build:all']);
  if (files.some((file) => file.startsWith('website/tests/build/')))
    run(worktree, 'pnpm', ['web:build']);
  // Each commit's config decides where its JSON report goes, so start clean and read what appears.
  const results = path.join(worktree, 'test-results');
  rmSync(results, { recursive: true, force: true });
  const fallback = path.join(results, 'vitest-verify.json');
  run(worktree, 'pnpm', [
    'exec',
    'vitest',
    'run',
    ...files,
    '--reporter=json',
    `--outputFile=${fallback}`,
  ]);
  const report = globSync(path.join(results, 'vitest*.json'))[0];
  return report ? vitestOutcome(JSON.parse(readFileSync(report, 'utf8'))) : noReport();
}

function runPlaywright(worktree: string, files: string[], suite: PlaywrightSuite): Outcome {
  const report = path.join(worktree, suite.report);
  rmSync(report, { force: true });
  run(worktree, 'pnpm', [suite.build]);
  run(worktree, 'pnpm', ['exec', 'playwright', 'test', '--config', suite.config, ...files]);
  return existsSync(report)
    ? playwrightOutcome(JSON.parse(readFileSync(report, 'utf8')))
    : noReport();
}

const sum = (outcomes: Outcome[]): Outcome =>
  outcomes.reduce(
    (total, next) => ({
      passed: total.passed + next.passed,
      failed: total.failed + next.failed,
      unexpected: [...total.unexpected, ...next.unexpected],
    }),
    { passed: 0, failed: 0, unexpected: [] as string[] },
  );

/** Checks out `sha` in the worktree and runs the given test files; returns their outcome. */
function runTests(worktree: string, sha: string, files: TestFiles): Outcome {
  git('-C', worktree, 'checkout', '--quiet', '--force', '--detach', sha);
  run(worktree, 'pnpm', ['install', '--frozen-lockfile', '--prefer-offline', '--silent']);
  const existing = (list: string[]) => list.filter((file) => existsSync(path.join(worktree, file)));
  const outcomes: Outcome[] = [];
  const vitest = existing(files.vitest);
  if (vitest.length) outcomes.push(runVitest(worktree, vitest));
  const e2e = existing(files.playwright);
  if (e2e.length) outcomes.push(runPlaywright(worktree, e2e, EXTENSION_E2E));
  const website = existing(files.websitePlaywright);
  if (website.length) outcomes.push(runPlaywright(worktree, website, WEBSITE_E2E));
  return sum(outcomes);
}

const noReport = (): Outcome => ({
  passed: 0,
  failed: 1,
  unexpected: ['the test run wrote no report'],
});

function verifyRound(worktree: string, round: Round): string[] {
  const label = `${round.task} (${round.red.sha.slice(0, 8)} → ${round.green?.sha.slice(0, 8)})`;
  const problems = redScopeViolations(round.red, isStubAt(round.red.sha)).map(
    (file) => `${label}: the red commit changes production code that isn't a stub: ${file}`,
  );
  const files = testFilesOf(round.red);
  if (!Object.values(files).some((list) => list.length)) {
    return [...problems, `${label}: the red commit adds no test file`];
  }
  const red = runTests(worktree, round.red.sha, files);
  if (red.failed === 0) problems.push(`${label}: the red commit's tests pass`);
  for (const message of red.unexpected)
    problems.push(`${label}: red fails for another reason: ${message}`);
  if (round.green) {
    const green = runTests(worktree, round.green.sha, files);
    if (green.failed || green.unexpected.length) problems.push(`${label}: the tests fail at green`);
  }
  return problems;
}

function main(): void {
  const commits = commitsIn(`${base}..${head}`);
  const { rounds, problems } = pairRounds(commits, redTasksOn(base));
  const messages = problems.map((p) => `${p.code}: ${p.message}`);
  const worktree = mkdtempSync(path.join(tmpdir(), 'sitemark-verify-tdd-'));
  try {
    git('worktree', 'add', '--quiet', '--detach', worktree, head);
    for (const round of rounds.filter((r) => r.green))
      messages.push(...verifyRound(worktree, round));
  } finally {
    git('worktree', 'remove', '--force', worktree);
    rmSync(worktree, { recursive: true, force: true });
  }
  console.log(`\nverify-tdd: ${commits.length} commits, ${rounds.length} red → green rounds`);
  for (const message of messages) console.log(`✗ ${message}`);
  if (messages.length) process.exit(1);
  console.log('✓ every round is red first, then green');
}

main();
