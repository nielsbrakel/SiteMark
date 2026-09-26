import type { Logger } from '../../app/ports';
import type { RenderItem } from '../../core/render/render-plan';
import type { DrawnItem, EffectView, ViewContext } from '../../shared/marker-view/effect-view';
import { createDisposer, type Disposer } from './disposer';
import { isolate } from './isolate';

/** Builds the view of a drawn item (`createView` from src/shared/marker-view in production). */
export type ViewFactory = (item: RenderItem, ctx: ViewContext) => EffectView | undefined;

/**
 * Called after a view mounted; whatever it registers on `disposer` is removed with the view
 * (e.g. the proximity fade's listeners, T-093).
 */
export type ViewMountHook = (item: DrawnItem, view: EffectView, disposer: Disposer) => void;

export type ViewSetDeps = {
  readonly ctx: ViewContext;
  readonly logger: Logger;
  readonly createView: ViewFactory;
  readonly onViewMount?: ViewMountHook | undefined;
};

/** The mounted views of a plan, by item key. Every call on a view is isolated (REQ-RND-009). */
export type ViewSet = {
  mount(item: DrawnItem): void;
  /** Updates the view; one that fails (or is missing) is replaced by a fresh mount. */
  update(item: DrawnItem): void;
  remove(key: string): void;
  viewOf(key: string): EffectView | undefined;
  dispose(): void;
};

type Mounted = { readonly view: EffectView; readonly disposer: Disposer };

export function createViewSet(deps: ViewSetDeps): ViewSet {
  const { ctx, logger } = deps;
  const mounted = new Map<string, Mounted>();

  const mount = (item: DrawnItem) => {
    const created = isolate(logger, `Mounting ${item.key}`, () => deps.createView(item, ctx));
    const view = created.ok ? created.value : undefined;
    if (!view) return;
    const disposer = createDisposer((error) => logger.error(`Disposing ${item.key} failed`, error));
    disposer.add(() => view.dispose());
    mounted.set(item.key, { view, disposer });
    isolate(logger, `Decorating ${item.key}`, () => deps.onViewMount?.(item, view, disposer));
  };
  const remove = (key: string) => {
    mounted.get(key)?.disposer.dispose();
    mounted.delete(key);
  };

  return {
    mount,
    update(item) {
      const current = mounted.get(item.key);
      const updated =
        current && isolate(logger, `Updating ${item.key}`, () => current.view.update(item)).ok;
      if (updated) return;
      remove(item.key);
      mount(item);
    },
    remove,
    viewOf: (key) => mounted.get(key)?.view,
    dispose() {
      for (const key of [...mounted.keys()]) remove(key);
    },
  };
}
