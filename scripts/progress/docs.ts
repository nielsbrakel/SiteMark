import { notImplemented } from '../../src/core/not-implemented.ts';
import type { Milestone, Requirement } from './model.ts';

/** The text of one spec and its task list (the extension's, or the website's). */
export type DocSource = { spec: string; tasks: string };

export type Docs = {
  requirements: Requirement[];
  requirementDuplicates: string[];
  milestones: Milestone[];
  taskDuplicates: string[];
};

/** Requirements and milestones of every document, with duplicates across all of them. */
export function readDocs(_sources: DocSource[]): Docs {
  return notImplemented();
}
