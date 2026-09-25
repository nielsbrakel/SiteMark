import { describe, expect, it } from 'vitest';
import { parseCommits, parseRequirements, parseTasks, taskState } from './model.ts';

const spec = `
| ID | P | Requirement |
| --- | --- | --- |
| REQ-URL-001 | M   | Wildcards |
| REQ-URL-002 | S   | Shorthand |
| REQ-URL-001 | M   | Duplicate |
`;

const tasks = `
## M1 — Core \`src/core\`

| Task  | Description | REQs | Tests | Status |
| ----- | ----------- | ---- | ----- | ------ |
| T-032 | Parser | REQ-URL-001, REQ-URL-002 | \`src/core/url/parse.test.ts\`, \`pnpm typecheck\` | ✅ |
| T-033 | Glob   | REQ-URL-001 | \`glob.test.ts\` | ☐ |

## M2 — App

| Task  | Description | REQs | Tests | Status |
| ----- | ----------- | ---- | ----- | ------ |
| T-032 | Duplicate | — | — | ☐ |
`;

describe('REQ-NFR-004 progress reads requirements and tasks from the docs', () => {
  it('parses requirement IDs with their priority and reports duplicates', () => {
    const { requirements, duplicates } = parseRequirements(spec);
    expect(requirements).toEqual([
      { id: 'REQ-URL-001', priority: 'M' },
      { id: 'REQ-URL-002', priority: 'S' },
    ]);
    expect(duplicates).toEqual(['REQ-URL-001']);
  });

  it('parses milestones, task REQs, test paths and the status column', () => {
    const { milestones, duplicates } = parseTasks(tasks);
    expect(milestones.map((m) => [m.id, m.name])).toEqual([
      ['M1', 'Core src/core'],
      ['M2', 'App'],
    ]);
    expect(milestones[0]?.tasks[0]).toEqual({
      id: 'T-032',
      reqs: ['REQ-URL-001', 'REQ-URL-002'],
      tests: ['src/core/url/parse.test.ts', 'pnpm typecheck'],
      done: true,
    });
    expect(milestones[0]?.tasks[1]?.done).toBe(false);
    expect(duplicates).toEqual(['T-032']);
  });

  it('parses the website milestones (W1, W2) like the extension ones', () => {
    const website = tasks.replace(
      '## M1 — Core `src/core`',
      '## W1 — Website foundation (before T-152)',
    );
    const { milestones } = parseTasks(website);
    expect(milestones.map((m) => [m.id, m.name])).toEqual([
      ['W1', 'Website foundation (before T-152)'],
      ['M2', 'App'],
    ]);
    expect(milestones[0]?.tasks.map((t) => t.id)).toEqual(['T-032', 'T-033']);
  });
});

describe('REQ-NFR-004 progress derives task status from git history (D-210)', () => {
  const log = [
    'a1\ttest(T-032): red — parser',
    'a2\tfeat(T-032): green — parser',
    'a3\trefactor(T-032): tidy',
    'b1\tchore(T-010,T-011): strict TS',
    'c1\ttest(T-040): red — schema',
    'd1\tfeat(T-050): green — migrate without red',
    'e1\tdocs: unrelated',
    'f1\tfixup! feat(T-032): green — parser',
  ].join('\n');
  const commits = () => parseCommits(log);

  it('extracts task commits with their phase, one entry per task', () => {
    expect(commits()).toEqual([
      { sha: 'a1', task: 'T-032', phase: 'red' },
      { sha: 'a2', task: 'T-032', phase: 'green' },
      { sha: 'a3', task: 'T-032', phase: 'refactor' },
      { sha: 'b1', task: 'T-010', phase: 'chore' },
      { sha: 'b1', task: 'T-011', phase: 'chore' },
      { sha: 'c1', task: 'T-040', phase: 'red' },
      { sha: 'd1', task: 'T-050', phase: 'green' },
    ]);
  });

  it('calls a task done after green, refactor or chore, and in progress while red', () => {
    expect(taskState(commits(), 'T-032')).toBe('done');
    expect(taskState(commits(), 'T-010')).toBe('done');
    expect(taskState(commits(), 'T-040')).toBe('red');
    expect(taskState(commits(), 'T-099')).toBe('todo');
  });

  it('treats a new red round after green as in progress', () => {
    const more = parseCommits(`${log}\ng1\ttest(T-032): red — second round`);
    expect(taskState(more, 'T-032')).toBe('red');
  });
});
