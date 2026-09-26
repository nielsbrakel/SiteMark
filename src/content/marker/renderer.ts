import type { Logger } from '../../app/ports';
import { diffPlan } from '../../core/render/diff-plan';
import { emptyPlan, type RenderItem, type RenderPlan } from '../../core/render/render-plan';
import type { FaviconStatus, TabStatus } from '../../core/render/status';
import { createView } from '../../shared/marker-view/create-view';
import type { ViewLabels } from '../../shared/marker-view/effect-view';
import type { Host, HostOptions } from './host';
import { openStage, type Stage } from './stage';
import type { ViewFactory, ViewMountHook } from './view-set';

/** The render items that change the document instead of being drawn (T-090, T-091). */
export type DocumentItem = Extract<RenderItem, { readonly effect: 'titlePrefix' | 'favicon' }>;

/** The owner of the title prefix and favicon (D-230). */
export type DocumentEffects = {
  /** The plan's current document items; `[]` strips the prefix and restores the favicon. */
  apply(items: readonly DocumentItem[]): void;
  faviconStatus(): FaviconStatus;
  /** Restores the title and favicon. */
  dispose(): void;
};

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

/** Until T-090/T-091 plug in the real ones: no title prefix, no favicon. */
const noDocumentEffects: DocumentEffects = {
  apply: () => undefined,
  faviconStatus: () => 'off',
  dispose: () => undefined,
};

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
      isDisposed = true;
      deps.onHostLost?.();
    },
  };
  let plan = emptyPlan();
  let stage: Stage | undefined;
  let isHidden = false;
  let isDisposed = false;
  const close = () => {
    stage?.close();
    stage = undefined;
  };

  return {
    apply(next) {
      if (isDisposed) return;
      const diff = diffPlan(plan, next);
      plan = next;
      if (next.items.length === 0) close();
      else {
        stage ??= openStage({ ...stageDeps, isHidden });
        stage.apply(diff, next);
      }
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
    dispose() {
      isDisposed = true;
      close();
    },
  };
}
