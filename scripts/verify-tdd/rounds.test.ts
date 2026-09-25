import { describe, expect, it } from 'vitest';
import { type Commit, pairRounds, redScopeViolations, testFilesOf } from './rounds.ts';

const commit = (sha: string, subject: string, files: string[] = []): Commit => ({
  sha,
  subject,
  files,
});

describe('REQ-NFR-004 verify-tdd pairs red and green commits (D-210)', () => {
  it('pairs each red with the next green of the same task', () => {
    const { rounds, problems } = pairRounds(
      [
        commit('r1', 'test(T-032): red — parse hosts'),
        commit('g1', 'feat(T-032): green — parse hosts'),
        commit('c1', 'chore(T-033): tooling'),
        commit('r2', 'test(T-032,T-033): red — ports'),
        commit('g2', 'feat(T-032,T-033): green — ports'),
        commit('rb', 'test(bug): red — ribbon'),
        commit('gb', 'fix(bug): green — ribbon'),
      ],
      new Set(),
    );
    expect(rounds.map((r) => [r.red.sha, r.green?.sha])).toEqual([
      ['r1', 'g1'],
      ['r2', 'g2'],
      ['rb', 'gb'],
    ]);
    expect(problems).toEqual([]);
  });

  it('reports a green without a red in the range or on the base branch', () => {
    const { problems } = pairRounds([commit('g1', 'feat(T-040): green — schema')], new Set());
    expect(problems.map((p) => p.code)).toEqual(['green-without-red']);
    const later = pairRounds([commit('g1', 'feat(T-040): green — schema')], new Set(['T-040']));
    expect(later.problems).toEqual([]);
  });

  it('reports a red that no green follows', () => {
    const { rounds, problems } = pairRounds([commit('r1', 'test(T-040): red — schema')], new Set());
    expect(rounds).toEqual([{ task: 'T-040', red: commit('r1', 'test(T-040): red — schema') }]);
    expect(problems.map((p) => p.code)).toEqual(['red-without-green']);
  });
});

describe('REQ-NFR-004 a red commit only adds tests, typed stubs and test infrastructure', () => {
  const isStub = (file: string) => file === 'src/core/url/parse.ts';

  it('allows tests, stubs, docs, locales and test config', () => {
    const red = commit('r', 'test(T-032): red — x', [
      'src/core/url/parse.test.ts',
      'src/core/url/parse.ts',
      'tests/fakes/tabs.ts',
      'tests/e2e/popup.spec.ts',
      'docs/testing.md',
      'public/_locales/en/messages.json',
      'package.json',
      'pnpm-lock.yaml',
      'vitest.config.ts',
      'src/core/tsconfig.json',
    ]);
    expect(redScopeViolations(red, isStub)).toEqual([]);
  });

  it('rejects production code that is not a stub', () => {
    const red = commit('r', 'test(T-032): red — x', ['src/core/url/glob.ts', 'wxt.config.ts']);
    expect(redScopeViolations(red, isStub)).toEqual(['src/core/url/glob.ts', 'wxt.config.ts']);
  });

  it('lists the test files a red commit adds or changes, by runner', () => {
    const red = commit('r', 'test(T-032): red — x', [
      'src/core/url/parse.test.ts',
      'tests/browser/layout.browser.test.ts',
      'tests/e2e/popup.spec.ts',
      'tests/fakes/tabs.ts',
    ]);
    expect(testFilesOf(red)).toEqual({
      vitest: ['src/core/url/parse.test.ts', 'tests/browser/layout.browser.test.ts'],
      playwright: ['tests/e2e/popup.spec.ts'],
    });
  });
});
