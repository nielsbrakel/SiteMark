import { notImplemented } from '../../src/core/not-implemented.ts';

export type Commit = { sha: string; subject: string; files: string[] };
export type Round = { task: string; red: Commit; green?: Commit };
export type Problem = { code: string; message: string };

/** Pairs every red commit with the next green commit of the same task (or `bug`). */
export function pairRounds(
  _commits: Commit[],
  _redOnBase: Set<string>,
): { rounds: Round[]; problems: Problem[] } {
  return notImplemented();
}

/** Files a red commit may not touch: anything but tests, typed stubs and test infrastructure. */
export function redScopeViolations(_red: Commit, _isStub: (file: string) => boolean): string[] {
  return notImplemented();
}

export function testFilesOf(_red: Commit): { vitest: string[]; playwright: string[] } {
  return notImplemented();
}
