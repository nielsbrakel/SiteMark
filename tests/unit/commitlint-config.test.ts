import lint from '@commitlint/lint';
import load from '@commitlint/load';
import type { LintOptions, QualifiedConfig } from '@commitlint/types';
import { beforeAll, describe, expect, it } from 'vitest';

// The commit format drives TDD enforcement (D-210): verify-tdd and progress read red/green
// commits by task ID, so a malformed header must never reach main.

let config: QualifiedConfig;
beforeAll(async () => {
  config = await load({}, { cwd: process.cwd() });
});

async function valid(message: string) {
  const options: LintOptions = {
    defaultIgnores: config.defaultIgnores ?? true,
    plugins: config.plugins,
    ...(config.ignores && { ignores: config.ignores }),
  };
  if (config.parserPreset?.parserOpts) {
    options.parserOpts = config.parserPreset.parserOpts as NonNullable<LintOptions['parserOpts']>;
  }
  const { valid, errors } = await lint(message, config.rules, options);
  return { valid, errors: errors.map((e) => e.name) };
}

const accepted = [
  'test(T-032): red — wildcard host matching',
  'feat(T-032): green — wildcard host matching',
  'refactor(T-032): extract the host tokenizer',
  'chore(T-010,T-011): strict TypeScript projects',
  'test(T-022,T-023): red — CI and supply-chain policy test',
  'test(bug): red — ribbon hides behind dialogs',
  'fix(bug): green — ribbon hides behind dialogs',
  'fix(ci): upload the built zips',
  'chore(deps): Bump actions/checkout from 4 to 7',
  'chore: update the lockfile',
  'docs: explain the release flow',
  'design: refresh the toolbar icons',
];

const rejected = [
  ['feat: add wildcard matching', 'feat needs a task scope'],
  ['feat(T-032): wildcard matching', 'feat subject starts with "green —"'],
  ['test(T-032): wildcard matching', 'test subject starts with "red —"'],
  ['refactor: tidy', 'refactor needs a task scope'],
  ['feat(T-32): green — typo in the task id', 'task IDs have three digits'],
  ['chore(stuff): something', 'unknown scope'],
  ['wip: half done', 'unknown type'],
  ['Add wildcard matching', 'no type'],
];

describe('REQ-NFR-004 commit messages follow the TDD commit format', () => {
  it.each(accepted)('accepts %s', async (message) => {
    expect(await valid(message)).toEqual({ valid: true, errors: [] });
  });

  it.each(rejected)('rejects %s (%s)', async (message) => {
    expect((await valid(message)).valid).toBe(false);
  });
});
