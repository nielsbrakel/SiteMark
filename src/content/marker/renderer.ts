import type { Logger } from '../../app/ports';
import { diffPlan } from '../../core/render/diff-plan';
import { emptyPlan, type RenderPlan } from '../../core/render/render-plan';
import type { TabStatus } from '../../core/render/status';
import { createView } from '../../shared/marker-view/create-view';
import type { ViewLabels } from '../../shared/marker-view/effect-view';
import {
  type DocumentEffects,
  noDocumentEffects,
  syncDocumentEffects,
} from './document-effects-port';
import type { Host, HostOptions } from './host';
import { isolate } from './isolate';
import { openStage, type Stage } from './stage';
import type { ViewFactory, ViewMountHook } from './view-set';

export type RendererDeps = {
  readonly createHost: (options: HostOptions) => Host;
  readonly logger: Logger;
  /** Read once per host, so an idle tab never touches i18n. */
  readonly labels: () => ViewLabels;
  readonly createView?: ViewFactory;
  readonly documentEffects?: DocumentEffects;
  /** Called after a view mounted, with a Disposer that goes with the view (e.g. T-093). */
  readonly onViewMount?: ViewMountHook;
  /** The tab status may have changed (a plan, a resolved element, the hidden state). */
  readonly onStatusChange?: () => void;
  /** The host went away on its own: a newer instance replaced it, or the extension is gone. */
  readonly onHostLost?: () => void;
};

export type Renderer = {
  /** Moves the tab to `plan` (keyed diff, REQ-RND-007). */
  apply(plan: RenderPlan): void;
  /** Hides or shows every mark (placeholder until T-098: only the view container). */
  setHidden(hidden: boolean): void;
  status(): TabStatus;
  /** Removes every view, the host, the document effects and all observers. Idempotent. */
  dispose(): void;
};

/** The stage a plan needs: none while it is empty (REQ-RND-009), else the open one or a new one. */
function stageFor(
  plan: RenderPlan,
  stage: Stage | undefined,
  open: () => Stage,
): Stage | undefined {
  if (plan.items.length > 0) return stage ?? open();
  stage?.close();
  return undefined;
}

/**
 * The marker's renderer (plan §3.3). It does nothing until a plan has items (REQ-RND-009): then
 * it creates the host, and it removes the host again when the plan empties. Views are keyed by
 * item and every step of every view is isolated, so one failing effect never takes the others.
 */
export function createRenderer(deps: RendererDeps): Renderer {
  const documentEffects = deps.documentEffects ?? noDocumentEffects;
  const changed = () => deps.onStatusChange?.();
  const stageDeps = {
    ...deps,
    createView: deps.createView ?? createView,
    // One set per document: a collapsed banner stays collapsed across plans (REQ-MARK-005).
    collapsedBanners: new Set<string>(),
    onTargetsChange: changed,
    onLost: () => {
      stage = undefined;
      dispose();
      deps.onHostLost?.();
    },
  };
  let plan = emptyPlan();
  let stage: Stage | undefined;
  let isHidden = false;
  let isDisposed = false;
  const dispose = () => {
    if (isDisposed) return;
    isDisposed = true;
    stage?.close();
    stage = undefined;
    isolate(deps.logger, 'Restoring the document', () => documentEffects.dispose());
  };

  return {
    apply(next) {
      if (isDisposed) return;
      const diff = diffPlan(plan, next);
      plan = next;
      stage = stageFor(next, stage, () => openStage({ ...stageDeps, isHidden }));
      stage?.apply(diff, next);
      syncDocumentEffects(documentEffects, diff, next, deps.logger);
      changed();
    },
    setHidden(hidden) {
      isHidden = hidden;
      stage?.setHidden(hidden);
      changed();
    },
    status: () => ({
      marks: stage?.marks() ?? [],
      favicon: documentEffects.faviconStatus(),
      hidden: isHidden,
    }),
    dispose,
  };
}
