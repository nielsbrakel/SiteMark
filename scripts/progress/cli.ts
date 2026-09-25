// Progress + requirement traceability (D-210).
//   pnpm progress              summary per milestone + requirement coverage
//   pnpm progress --verbose    also list requirements without a passing test
//   pnpm progress --strict     exit 1 on broken traceability (CI)
//   pnpm progress --coverage   also fail finished requirements that no passing test names
//                              (reads every test-results/vitest-*.json and playwright.json)
//   pnpm progress --sync       rewrite the Status column of both task lists from git
// Reads the extension docs (docs/spec.md, docs/tasks.md) and the website docs (docs/website/, W milestones).
import { execFileSync } from 'node:child_process';
import { existsSync, globSync, readFileSync, writeFileSync } from 'node:fs';
import { check, type Problem } from './check.ts';
import { readDocs } from './docs.ts';
import { type Milestone, parseCommits, type Requirement, taskState } from './model.ts';
import { coveredRequirements, passingTitles } from './results.ts';

const DOCS = [
  { spec: 'docs/spec.md', tasks: 'docs/tasks.md' },
  { spec: 'docs/website/spec.md', tasks: 'docs/website/tasks.md' },
];

/** M0 finished before task-scoped commits existed; git can't prove these. */
const LEGACY_DONE = [
  'T-001',
  'T-002',
  'T-003',
  'T-004',
  'T-005',
  'T-006',
  'T-007',
  'T-008',
  'T-009',
];

const args = new Set(process.argv.slice(2));
const git = (...gitArgs: string[]) => execFileSync('git', gitArgs, { encoding: 'utf8' }).trim();

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function testReports() {
  const vitest = globSync('test-results/vitest-*.json').map(readJson);
  const playwright = existsSync('test-results/playwright.json')
    ? readJson('test-results/playwright.json')
    : undefined;
  const titles = [
    ...vitest.flatMap((report) => passingTitles({ vitest: report })),
    ...passingTitles({ playwright }),
  ];
  return { count: vitest.length + (playwright ? 1 : 0), covered: coveredRequirements(titles) };
}

function mentionedRequirements(): Set<string> {
  const files = globSync([
    'src/**/*.test.{ts,tsx}',
    'tests/**/*.{test,spec}.{ts,tsx}',
    'website/{src,scripts,tests}/**/*.{test,spec}.{ts,tsx}',
  ]);
  return new Set(files.flatMap((f) => readFileSync(f, 'utf8').match(/REQ-[A-Z0-9]+-\d{3}/g) ?? []));
}

/** A path or glob from the Tests column; bare file names may live under src/, tests/ or website/. */
function fileExists(entry: string): boolean {
  const patterns = entry.includes('/')
    ? [entry]
    : [`src/**/${entry}`, `tests/**/${entry}`, `website/{src,scripts,tests}/**/${entry}`];
  return globSync(patterns).length > 0;
}

function bar(done: number, total: number, width = 20): string {
  const filled = total ? Math.round((done / total) * width) : 0;
  return `${'█'.repeat(filled)}${'░'.repeat(width - filled)}`;
}

function printMilestones(milestones: Milestone[], isDone: (task: string) => boolean): void {
  console.log('\nSiteMark progress\n');
  for (const m of milestones) {
    const done = m.tasks.filter((t) => isDone(t.id)).length;
    const wip = done > 0 && done < m.tasks.length ? '  (in progress)' : '';
    const count = `${String(done).padStart(3)}/${String(m.tasks.length).padEnd(3)}`;
    console.log(`${m.id.padEnd(4)} ${bar(done, m.tasks.length)} ${count} ${m.name}${wip}`);
  }
  const all = milestones.flatMap((m) => m.tasks);
  const done = all.filter((t) => isDone(t.id)).length;
  const percent = Math.round((done / all.length) * 100);
  console.log(`\nAll ${bar(done, all.length)} ${done}/${all.length} tasks (${percent} %)`);
}

function syncStatusColumn(isDone: (task: string) => boolean): void {
  for (const { tasks } of DOCS) {
    const text = readFileSync(tasks, 'utf8').replace(
      /^(\| (T-\d{3}) \|.*\| )(✅|☐)(\s*\|)$/gm,
      (_row, head: string, id: string, _status: string, tail: string) =>
        `${head}${isDone(id) ? '✅' : '☐'}${tail.length > 1 ? tail : ' |'}`,
    );
    writeFileSync(tasks, text);
    console.log(`${tasks}: Status column synced from git. Run \`pnpm format\` to realign.`);
  }
}

function printRequirements(
  requirements: Requirement[],
  reports: { count: number; covered: Set<string> },
): void {
  const musts = requirements.filter((r) => r.priority === 'M').length;
  const covered = requirements.filter((r) => reports.covered.has(r.id)).length;
  console.log(`\nRequirements: ${requirements.length} defined (${musts} Must)`);
  console.log(
    `  with a passing test: ${covered}/${requirements.length} (${reports.count} report(s) in test-results/)`,
  );
  if (args.has('--verbose')) {
    const missing = requirements.filter((r) => !reports.covered.has(r.id)).map((r) => r.id);
    console.log(`\nNot yet covered by a passing test:\n  ${missing.join('\n  ')}`);
  }
}

function main(): void {
  if (git('rev-parse', '--is-shallow-repository') === 'true') {
    console.error('progress needs the full git history (actions/checkout: fetch-depth: 0).');
    process.exit(1);
  }
  const docs = readDocs(
    DOCS.map((doc) => ({
      spec: readFileSync(doc.spec, 'utf8'),
      tasks: readFileSync(doc.tasks, 'utf8'),
    })),
  );
  // biome-ignore lint/security/noSecrets: a git log format string (hash TAB subject), not a secret
  const commits = parseCommits(git('log', '--reverse', '--format=%H%x09%s', 'HEAD'));
  const isDone = (task: string) =>
    LEGACY_DONE.includes(task) || taskState(commits, task) === 'done';
  if (args.has('--sync')) {
    syncStatusColumn(isDone);
    return;
  }

  const reports = testReports();
  const problems: Problem[] = check({
    requirements: docs.requirements,
    requirementDuplicates: docs.requirementDuplicates,
    milestones: docs.milestones,
    taskDuplicates: docs.taskDuplicates,
    commits,
    legacyDone: LEGACY_DONE,
    mentionedRequirements: mentionedRequirements(),
    covered: args.has('--coverage') ? reports.covered : undefined,
    fileExists,
  });
  if (args.has('--coverage') && reports.count === 0) {
    problems.push({ code: 'no-test-reports', message: 'No test reports in test-results/' });
  }

  printMilestones(docs.milestones, isDone);
  const inProgress = [...new Set(commits.map((c) => c.task))].filter(
    (task) => taskState(commits, task) === 'red',
  );
  if (inProgress.length) console.log(`In red: ${inProgress.join(', ')}`);

  printRequirements(docs.requirements, reports);
  for (const p of problems) console.log(`✗ ${p.code}: ${p.message}`);
  console.log('');
  if (args.has('--strict') && problems.length) process.exit(1);
}

main();
