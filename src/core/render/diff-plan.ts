import { notImplemented } from '../not-implemented';
import type { RenderItem, RenderPlan } from './render-plan';

/** What a tab changes to go from one plan to the next (REQ-RND-007), matched by item key. */
export type PlanDiff = {
  /** New keys, in the next plan's order. */
  readonly add: readonly RenderItem[];
  /** Kept keys whose item changed in any field: the next version, in the next plan's order. */
  readonly update: readonly RenderItem[];
  /** Keys that are gone: the previous version (e.g. the title prefix to strip). */
  readonly remove: readonly RenderItem[];
};

export function diffPlan(_prev: RenderPlan, _next: RenderPlan): PlanDiff {
  return notImplemented();
}
