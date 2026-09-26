import type { Logger } from '../../app/ports';
import type { PlanDiff } from '../../core/render/diff-plan';
import type { RenderItem } from '../../core/render/render-plan';
import type { DrawnItem, ViewLabels } from '../../shared/marker-view/effect-view';
import { markerViewCss } from '../../shared/marker-view/marker-view-css';
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
  /** The host went away on its own (a newer instance, or the extension is gone). */
  readonly onLost: () => void;
};

/** The host and the views drawn in it: exists only while the plan has items (REQ-RND-009). */
export type Stage = {
  apply(diff: PlanDiff): void;
  /** Removes the views and the host. */
  close(): void;
};

export function isDrawn(item: RenderItem): item is DrawnItem {
  return item.effect !== 'titlePrefix' && item.effect !== 'favicon';
}

export function openStage(deps: StageDeps): Stage {
  let isClosing = false;
  const host = deps.createHost({
    onDispose: () => {
      if (isClosing) return;
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

  return {
    apply(diff) {
      for (const item of diff.remove) views.remove(item.key);
      for (const item of diff.add) if (isDrawn(item)) views.mount(item);
      for (const item of diff.update) if (isDrawn(item)) views.update(item);
    },
    close() {
      isClosing = true;
      views.dispose();
      host.dispose();
    },
  };
}
