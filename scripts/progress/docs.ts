import { type Milestone, parseRequirements, parseTasks, type Requirement } from './model.ts';

/** The text of one spec and its task list (the extension's, or the website's). */
export type DocSource = { spec: string; tasks: string };

export type Docs = {
  requirements: Requirement[];
  requirementDuplicates: string[];
  milestones: Milestone[];
  taskDuplicates: string[];
};

/** Requirements and milestones of every document, with duplicates across all of them. */
export function readDocs(sources: DocSource[]): Docs {
  const spec = parseRequirements(sources.map((source) => source.spec).join('\n'));
  const plan = parseTasks(sources.map((source) => source.tasks).join('\n'));
  return {
    requirements: spec.requirements,
    requirementDuplicates: spec.duplicates,
    milestones: plan.milestones,
    taskDuplicates: plan.duplicates,
  };
}
