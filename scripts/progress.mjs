// Progress + requirement traceability report.
//   pnpm progress            summary per milestone + coverage of requirements
//   pnpm progress --verbose  also list every requirement without a test yet
//   pnpm progress --strict   exit 1 on broken traceability (used in CI)
//
// Sources: docs/spec.md (REQ definitions), docs/tasks.md (task rows + Status column),
// test files (REQ IDs mentioned in describe/it names or comments).
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const args = new Set(process.argv.slice(2));
const REQ = /REQ-[A-Z0-9]+-\d{3}/g;

// 1. Requirements defined in the spec: the first cell of a table row.
const spec = readFileSync('docs/spec.md', 'utf8');
const defined = new Map(); // id -> priority
for (const m of spec.matchAll(/^\|\s*(REQ-[A-Z0-9]+-\d{3})\s*\|\s*([MSC])\s*\|/gm)) {
  defined.set(m[1], m[2]);
}

// 2. Tasks grouped by milestone.
const milestones = [];
for (const line of readFileSync('docs/tasks.md', 'utf8').split('\n')) {
  const heading = line.match(/^## (M[\d.]+) — (.+)$/);
  if (heading) {
    milestones.push({ id: heading[1], name: heading[2].replaceAll('`', ''), tasks: [] });
    continue;
  }
  const row = line.match(/^\|\s*(T-\d{3})\s*\|/);
  if (!row || !milestones.length) continue;
  // Columns: Task | Description | REQs | Tests | Status. Superseded by git-derived status in T-019.
  const cells = line
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim());
  const [id, , reqs, , status] = cells;
  milestones.at(-1).tasks.push({ id, reqs: reqs.match(REQ) ?? [], done: status === '✅' });
}

// 3. Requirements mentioned by tests.
const testFiles = [
  ...readdirSync('src', { recursive: true })
    .map((f) => path.join('src', f))
    .filter((f) => /\.test\.tsx?$/.test(f)),
  ...readdirSync('tests', { recursive: true })
    .map((f) => path.join('tests', f))
    .filter((f) => /\.(test|spec)\.tsx?$/.test(f)),
];
const tested = new Set(testFiles.flatMap((f) => readFileSync(f, 'utf8').match(REQ) ?? []));

// Report
const bar = (done, total, width = 20) => {
  const filled = total ? Math.round((done / total) * width) : 0;
  return `${'█'.repeat(filled)}${'░'.repeat(width - filled)}`;
};
const allTasks = milestones.flatMap((m) => m.tasks);
console.log('\nSiteMark progress\n');
for (const m of milestones) {
  const done = m.tasks.filter((t) => t.done).length;
  const wip = done > 0 && done < m.tasks.length ? '  (in progress)' : '';
  console.log(
    `${m.id.padEnd(4)} ${bar(done, m.tasks.length)} ${String(done).padStart(3)}/${String(m.tasks.length).padEnd(3)} ${m.name}${wip}`,
  );
}
const doneAll = allTasks.filter((t) => t.done).length;
console.log(
  `\nAll ${bar(doneAll, allTasks.length)} ${doneAll}/${allTasks.length} tasks (${Math.round((doneAll / allTasks.length) * 100)} %)`,
);

const referenced = new Set(allTasks.flatMap((t) => t.reqs));
const withoutTask = [...defined.keys()].filter((r) => !referenced.has(r));
const unknown = [...new Set([...referenced, ...tested])].filter((r) => !defined.has(r));
const untested = [...defined.keys()].filter((r) => !tested.has(r));
const musts = [...defined].filter(([, p]) => p === 'M').map(([r]) => r);

console.log(`\nRequirements: ${defined.size} defined (${musts.length} Must)`);
console.log(`  with a task : ${defined.size - withoutTask.length}/${defined.size}`);
console.log(`  with a test : ${defined.size - untested.length}/${defined.size}`);
if (withoutTask.length) console.log(`\n✗ Requirements without a task: ${withoutTask.join(', ')}`);
if (unknown.length) console.log(`\n✗ Unknown requirement IDs referenced: ${unknown.join(', ')}`);
if (args.has('--verbose') && untested.length) {
  console.log(`\nNot yet covered by a test:\n  ${untested.join('\n  ')}`);
}
console.log('');

if (args.has('--strict') && (withoutTask.length || unknown.length)) process.exit(1);
