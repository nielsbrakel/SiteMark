import type { Logger } from '../../app/ports';
import type { PlanDiff } from '../../core/render/diff-plan';
import type { RenderItem, RenderPlan } from '../../core/render/render-plan';
import type { FaviconStatus } from '../../core/render/status';
import { isolate } from './isolate';

/** The render items that change the document instead of being drawn (T-090, T-091). */
export type DocumentItem = Extract<RenderItem, { readonly effect: 'titlePrefix' | 'favicon' }>;

/**
 * The single owner of the title prefix and the favicon (plan §3.3, D-230), plugged into the
 * renderer. Until T-090/T-091 provide it, the renderer uses `noDocumentEffects`.
 */
export type DocumentEffects = {
  /** The plan's current document items, whenever they change; `[]` strips and restores. */
  apply(items: readonly DocumentItem[]): void;
  faviconStatus(): FaviconStatus;
  /** Restores the title and the favicon. */
  dispose(): void;
};

export const noDocumentEffects: DocumentEffects = {
  apply: () => undefined,
  faviconStatus: () => 'off',
  dispose: () => undefined,
};

function isDocumentItem(item: RenderItem): item is DocumentItem {
  return item.effect === 'titlePrefix' || item.effect === 'favicon';
}

/** Hands the plan's document items to `effects` when the diff touched any of them. */
export function syncDocumentEffects(
  effects: DocumentEffects,
  diff: PlanDiff,
  plan: RenderPlan,
  logger: Logger,
): void {
  const touched = [...diff.add, ...diff.update, ...diff.remove].some(isDocumentItem);
  if (!touched) return;
  isolate(logger, 'Document effects', () => effects.apply(plan.items.filter(isDocumentItem)));
}
