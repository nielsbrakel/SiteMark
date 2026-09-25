// Commit format (docs/testing.md#tdd-protocol, D-210). verify-tdd and `pnpm progress` read task
// IDs and red/green markers from these headers, so the rules are strict where it matters.

const TASKS = /^T-\d{3}(,T-\d{3})*$/;
const RED = /^red( —| -|:) /;
const GREEN = /^green( —| -|:) /;

/** @type {(parsed: { type?: string | null; scope?: string | null; subject?: string | null }) => [boolean, string]} */
function taskScope({ type, scope, subject }) {
  const task = TASKS.test(scope ?? '');
  const text = subject ?? '';
  switch (type) {
    case 'test':
      return [
        (task || scope === 'bug') && RED.test(text),
        'test commits are `test(T-xxx|bug): red — …`',
      ];
    case 'feat':
      return [task && GREEN.test(text), 'feat commits are `feat(T-xxx): green — …`'];
    case 'refactor':
      return [task, 'refactor commits are `refactor(T-xxx): …`'];
    case 'fix':
      return [scope !== 'bug' || GREEN.test(text), 'bug fixes are `fix(bug): green — …`'];
    default:
      return [true, ''];
  }
}

/** @type {(parsed: { scope?: string | null }) => [boolean, string]} */
function knownScope({ scope }) {
  const ok = !scope || TASKS.test(scope) || ['bug', 'ci', 'deps', 'release'].includes(scope);
  return [ok, 'scope is a task list (T-001,T-002), bug, ci, deps or release'];
}

/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [{ rules: { 'sitemark/task-scope': taskScope, 'sitemark/known-scope': knownScope } }],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'test',
        'refactor',
        'chore',
        'docs',
        'design',
        'ci',
        'build',
        'perf',
        'revert',
      ],
    ],
    'sitemark/task-scope': [2, 'always'],
    'sitemark/known-scope': [2, 'always'],
    // Task IDs are upper case, Dependabot writes "Bump …", and long URLs appear in bodies.
    'scope-case': [0],
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [1, 'always', 100],
    'footer-max-line-length': [1, 'always', 100],
  },
};
