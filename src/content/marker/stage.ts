import type { Logger } from '../../app/ports';
import type { PlanDiff } from '../../core/render/diff-plan';
import type { RenderItem, RenderPlan } from '../../core/render/render-plan';
import type { MarkStatus } from '../../core/render/status';
import type { DrawnItem, ViewLabels } from '../../shared/marker-view/effect-view';
import { markerViewCss } from '../../shared/marker-view/marker-view-css';
import { createElementMarks, isElementItem } from './element-marks';
import type { Host, HostOptions } from './host';
import { createViewSet, type ViewFactory, type ViewMountHook } from './view-set';

export type StageDeps = {
  readonly createHost: (options: HostOptions) => Host;
  readonly logger: Logger;
  readonly labels: () => ViewLabels;
  readonly createView: ViewFactory;
  readonly onViewMount?: ViewMountHook | undefined;
  /** One set per document: a collapsed banner stays collapsed across plans and hosts. */
  readonly collapsedBanners: Set<string>;
  /** Whether the views start hidden (the hide placeholder until T-098). */
  readonly isHidden: boolean;
  /** The host went away on its own (a newer instance, or the extension is gone). */
  readonly onLost: () => void;
  /** An element target was found, lost or replaced. */
  readonly onTargetsChange: () => void;
};

/** The host and the views drawn in it: exists only while the plan has items (REQ-RND-009). */
export type Stage = {
  /** Applies the diff that leads to `plan`. */
  apply(diff: PlanDiff, plan: RenderPlan): void;
  /** Hides or shows the view container (the hide placeholder until T-098). */
  setHidden(hidden: boolean): void;
  /** The status of the plan's element marks. */
  marks(): MarkStatus[];
  /** Removes the views and the host. */
  close(): void;
};

function isDrawn(item: RenderItem): item is DrawnItem {
  return item.effect !== 'titlePrefix' && item.effect !== 'favicon';
}

export function openStage(deps: StageDeps): Stage {
  let isClosing = false;
  const host = deps.createHost({
    onDispose: () => {
      if (isClosing) return;
      elements.dispose();
      views.dispose();
      deps.onLost();
    },
  });
  host.adoptStyles([markerViewCss()]);
  host.show();
  const views = createViewSet({
    ctx: { container: host.root, collapsedBanners: deps.collapsedBanners, labels: deps.labels() },
    logger: deps.logger,
    createView: deps.createView,
    onViewMount: deps.onViewMount,
  });
  const elements = createElementMarks(deps.onTargetsChange);
  host.root.hidden = deps.isHidden;

  return {
    apply(diff, plan) {
      for (const item of diff.remove) views.remove(item.key);
      for (const item of diff.add) if (isDrawn(item)) views.mount(item);
      for (const item of diff.update) if (isDrawn(item)) views.update(item);
      elements.sync(plan.items.filter(isElementItem), views.viewOf);
    },
    setHidden(hidden) {
      host.root.hidden = hidden;
    },
    marks: () => elements.statuses(),
    close() {
      isClosing = true;
      elements.dispose();
      views.dispose();
      host.dispose();
    },
  };
}
