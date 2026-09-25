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

/** Structural equality of plain JSON values (a render plan has nothing else). */
function jsonEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  const aRecord = a as Record<string, unknown>;
  const bRecord = b as Record<string, unknown>;
  return aKeys.every((key) => Object.hasOwn(bRecord, key) && jsonEqual(aRecord[key], bRecord[key]));
}

export function diffPlan(prev: RenderPlan, next: RenderPlan): PlanDiff {
  const before = new Map(prev.items.map((item) => [item.key, item]));
  const after = new Set(next.items.map((item) => item.key));
  return {
    add: next.items.filter((item) => !before.has(item.key)),
    update: next.items.filter((item) => {
      const old = before.get(item.key);
      return old !== undefined && !jsonEqual(old, item);
    }),
    remove: prev.items.filter((item) => !after.has(item.key)),
  };
}
