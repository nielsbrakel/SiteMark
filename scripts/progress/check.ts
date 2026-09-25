import { type Milestone, type Requirement, type TaskCommit, taskState } from './model.ts';

export type CheckInput = {
  requirements: Requirement[];
  requirementDuplicates: string[];
  milestones: Milestone[];
  taskDuplicates: string[];
  commits: TaskCommit[];
  /** Tasks finished before task-scoped commits existed (M0). */
  legacyDone: string[];
  /** REQ IDs mentioned anywhere in test files. */
  mentionedRequirements: Set<string>;
  /** REQ IDs named by a passing test; undefined when no test report exists. */
  covered: Set<string> | undefined;
  fileExists: (pathOrGlob: string) => boolean;
};

export type Problem = { code: string; message: string };

const problem = (code: string, message: string): Problem => ({ code, message });
const tasksOf = (input: CheckInput) => input.milestones.flatMap((m) => m.tasks);

function isDone(input: CheckInput, task: string): boolean {
  return input.legacyDone.includes(task) || taskState(input.commits, task) === 'done';
}

function identity(input: CheckInput): Problem[] {
  const defined = new Set(input.requirements.map((r) => r.id));
  const referenced = new Set(tasksOf(input).flatMap((t) => t.reqs));
  const unknown = [...new Set([...referenced, ...input.mentionedRequirements])].filter(
    (id) => !defined.has(id),
  );
  return [
    ...input.requirementDuplicates.map((id) =>
      problem('duplicate-requirement', `${id} is defined twice`),
    ),
    ...input.taskDuplicates.map((id) =>
      problem('duplicate-task', `${id} appears twice in tasks.md`),
    ),
    ...[...defined]
      .filter((id) => !referenced.has(id))
      .map((id) => problem('requirement-without-task', `${id} has no task`)),
    ...unknown.map((id) => problem('unknown-requirement', `${id} is not defined in spec.md`)),
  ];
}

function status(input: CheckInput): Problem[] {
  return tasksOf(input)
    .filter((task) => task.done !== isDone(input, task.id))
    .map((task) => {
      const git = input.legacyDone.includes(task.id) ? 'done' : taskState(input.commits, task.id);
      const column = task.done ? '✅' : '☐';
      return problem('status-mismatch', `${task.id} is ${column} in tasks.md but ${git} in git`);
    });
}

function tddOrder(input: CheckInput): Problem[] {
  const tasks = [...new Set(input.commits.map((c) => c.task))];
  return tasks.flatMap((task) => {
    const phases = input.commits.filter((c) => c.task === task).map((c) => c.phase);
    const green = phases.indexOf('green');
    const red = phases.indexOf('red');
    return green >= 0 && (red < 0 || red > green)
      ? [problem('green-without-red', `${task} has a green commit before any red commit`)]
      : [];
  });
}

/** Tests-column entries that name a file (not a command like `pnpm typecheck`). */
const isPath = (entry: string) => /\.(test|spec)\.tsx?$|\/\*/.test(entry) && !entry.includes(' ');

function testPaths(input: CheckInput): Problem[] {
  return tasksOf(input)
    .filter((task) => isDone(input, task.id))
    .flatMap((task) =>
      task.tests
        .filter((entry) => isPath(entry) && !input.fileExists(entry))
        .map((entry) =>
          problem('missing-test-path', `${task.id} lists ${entry}, which doesn't exist`),
        ),
    );
}

function coverage(input: CheckInput): Problem[] {
  const { covered } = input;
  if (!covered) return [];
  const tasks = tasksOf(input);
  return input.requirements
    .filter(({ id }) => {
      const owners = tasks.filter((task) => task.reqs.includes(id));
      return (
        owners.length > 0 && owners.every((task) => isDone(input, task.id)) && !covered.has(id)
      );
    })
    .map(({ id }) =>
      problem('uncovered-requirement', `${id} is finished but no passing test names it`),
    );
}

export function check(input: CheckInput): Problem[] {
  return [
    ...identity(input),
    ...status(input),
    ...tddOrder(input),
    ...testPaths(input),
    ...coverage(input),
  ];
}
