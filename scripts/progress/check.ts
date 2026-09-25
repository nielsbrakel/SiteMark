import { notImplemented } from '../../src/core/not-implemented.ts';
import type { Milestone, Requirement, TaskCommit } from './model.ts';

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

export function check(_input: CheckInput): Problem[] {
  return notImplemented();
}
