export type Commit = { sha: string; subject: string; files: string[] };
export type Round = { task: string; red: Commit; green?: Commit };
export type Problem = { code: string; message: string };

const HEADER = /^(\w+)\(((?:T-\d{3}(?:,T-\d{3})*)|bug)\)!?: (red|green)\b/;

/** `test(T-001,T-002): red — …` → { phase: 'red', key: 'T-001,T-002' }. */
function classify(subject: string): { phase: 'red' | 'green'; key: string } | undefined {
  const match = subject.match(HEADER);
  if (!match) return undefined;
  const [, type, key = '', phase] = match;
  if (phase === 'red' && type === 'test') return { phase, key };
  if (phase === 'green' && (type === 'feat' || (type === 'fix' && key === 'bug'))) {
    return { phase, key };
  }
  return undefined;
}

const tasksIn = (key: string) => key.split(',');

/** Pairs every red commit with the next green commit of the same task (or `bug`). */
export function pairRounds(
  commits: Commit[],
  redOnBase: Set<string>,
): { rounds: Round[]; problems: Problem[] } {
  const rounds: Round[] = [];
  const problems: Problem[] = [];
  for (const commit of commits) {
    const kind = classify(commit.subject);
    if (kind?.phase === 'red') rounds.push({ task: kind.key, red: commit });
    if (kind?.phase !== 'green') continue;
    const open = rounds.find((round) => round.task === kind.key && !round.green);
    if (open) open.green = commit;
    else if (!tasksIn(kind.key).every((task) => redOnBase.has(task))) {
      problems.push({
        code: 'green-without-red',
        message: `${commit.sha.slice(0, 8)} "${commit.subject}" has no red commit before it`,
      });
    }
  }
  for (const round of rounds.filter((r) => !r.green)) {
    problems.push({
      code: 'red-without-green',
      message: `${round.red.sha.slice(0, 8)} "${round.red.subject}" has no green commit after it`,
    });
  }
  return { rounds, problems };
}

const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;
const INFRA = [
  TEST_FILE,
  /^tests\//,
  /^docs\//,
  /\.md$/,
  /^public\/_locales\//,
  /^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|vitest\.config\.ts|playwright\.config\.ts)$/,
  /(^|\/)tsconfig\.json$/,
  // The website workspace (D-244) follows the same protocol.
  /^website\/(tests|locales)\//,
  /^website\/package\.json$/,
];

/** Files a red commit may not touch: anything but tests, typed stubs and test infrastructure. */
export function redScopeViolations(red: Commit, isStub: (file: string) => boolean): string[] {
  return red.files.filter((file) => !INFRA.some((pattern) => pattern.test(file)) && !isStub(file));
}

export function testFilesOf(red: Commit): { vitest: string[]; playwright: string[] } {
  const tests = red.files.filter((file) => TEST_FILE.test(file));
  return {
    vitest: tests.filter((file) => /\.test\.[cm]?[jt]sx?$/.test(file)),
    playwright: tests.filter((file) => /^tests\/e2e\/.*\.spec\.ts$/.test(file)),
  };
}
