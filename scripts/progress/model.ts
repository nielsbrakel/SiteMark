import { notImplemented } from '../../src/core/not-implemented.ts';

export type Priority = 'M' | 'S' | 'C';
export type Requirement = { id: string; priority: Priority };
export type Task = { id: string; reqs: string[]; tests: string[]; done: boolean };
export type Milestone = { id: string; name: string; tasks: Task[] };
export type Phase = 'red' | 'green' | 'refactor' | 'chore';
export type TaskCommit = { sha: string; task: string; phase: Phase };
export type TaskState = 'todo' | 'red' | 'done';

export function parseRequirements(_spec: string): {
  requirements: Requirement[];
  duplicates: string[];
} {
  return notImplemented();
}

export function parseTasks(_tasks: string): { milestones: Milestone[]; duplicates: string[] } {
  return notImplemented();
}

/** `git log --reverse --format=%H%x09%s` output → task commits, oldest first. */
export function parseCommits(_log: string): TaskCommit[] {
  return notImplemented();
}

export function taskState(_commits: TaskCommit[], _task: string): TaskState {
  return notImplemented();
}
