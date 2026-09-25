export type Priority = 'M' | 'S' | 'C';
export type Requirement = { id: string; priority: Priority };
export type Task = { id: string; reqs: string[]; tests: string[]; done: boolean };
export type Milestone = { id: string; name: string; tasks: Task[] };
export type Phase = 'red' | 'green' | 'refactor' | 'chore';
export type TaskCommit = { sha: string; task: string; phase: Phase };
export type TaskState = 'todo' | 'red' | 'done';

const REQ = /REQ-[A-Z0-9]+-\d{3}/g;

function duplicatesOf(ids: string[]): string[] {
  return [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
}

/** Requirements are table rows whose first cell is a REQ ID and second a priority. */
export function parseRequirements(spec: string): {
  requirements: Requirement[];
  duplicates: string[];
} {
  const rows = [...spec.matchAll(/^\|\s*(REQ-[A-Z0-9]+-\d{3})\s*\|\s*([MSC])\s*\|/gm)];
  const ids = rows.map((m) => m[1] ?? '');
  const seen = new Set<string>();
  const requirements = rows.flatMap(([, id = '', priority]) => {
    if (seen.has(id)) return [];
    seen.add(id);
    return [{ id, priority: priority as Priority }];
  });
  return { requirements, duplicates: duplicatesOf(ids) };
}

function cells(line: string): string[] {
  return line
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function parseTaskRow(line: string): Task {
  const [id = '', , reqs = '', tests = '', status = ''] = cells(line);
  return {
    id,
    reqs: reqs.match(REQ) ?? [],
    tests: [...tests.matchAll(/`([^`]+)`/g)].map((m) => m[1] ?? ''),
    done: status === '✅',
  };
}

/**
 * Milestones are `## M<n> — <name>` (extension) or `## W<n> — <name>` (website) headings; tasks are
 * the `| T-xxx |` rows below them.
 */
export function parseTasks(text: string): { milestones: Milestone[]; duplicates: string[] } {
  const milestones: Milestone[] = [];
  for (const line of text.split('\n')) {
    const heading = line.match(/^## ([MW][\d.]+) — (.+)$/);
    if (heading) {
      milestones.push({
        id: heading[1] ?? '',
        name: (heading[2] ?? '').replaceAll('`', ''),
        tasks: [],
      });
    } else if (/^\|\s*T-\d{3}\s*\|/.test(line)) {
      milestones.at(-1)?.tasks.push(parseTaskRow(line));
    }
  }
  const ids = milestones.flatMap((m) => m.tasks.map((t) => t.id));
  return { milestones, duplicates: duplicatesOf(ids) };
}

function phaseOf(type: string, subject: string): Phase {
  if (type === 'test' && /^red\b/.test(subject)) return 'red';
  if (type === 'feat' && /^green\b/.test(subject)) return 'green';
  if (type === 'refactor') return 'refactor';
  return 'chore';
}

/** `git log --reverse --format=%H%x09%s` output → task commits, oldest first. */
export function parseCommits(log: string): TaskCommit[] {
  return log.split('\n').flatMap((line) => {
    const [sha = '', header = ''] = line.split('\t');
    const match = header.match(/^(\w+)\((T-\d{3}(?:,T-\d{3})*)\)!?: (.*)$/);
    if (!match) return [];
    const [, type = '', scope = '', subject = ''] = match;
    const phase = phaseOf(type, subject);
    return scope.split(',').map((task) => ({ sha, task, phase }));
  });
}

export function taskState(commits: TaskCommit[], task: string): TaskState {
  const own = commits.filter((commit) => commit.task === task);
  const last = own.at(-1);
  if (!last) return 'todo';
  return last.phase === 'red' ? 'red' : 'done';
}
