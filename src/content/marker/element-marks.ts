import type { MarkId } from '../../core/ids';
import type { RenderItem } from '../../core/render/render-plan';
import type { MarkStatus } from '../../core/render/status';
import { createElementResolver, type ElementResolver } from './element-resolver';
import { createTracker, type TrackedView, type Tracker } from './tracker';

/** A render item drawn on an element. */
export type ElementItem = Exclude<RenderItem, { readonly target: 'page' }>;

export function isElementItem(item: RenderItem): item is ElementItem {
  return item.target !== 'page';
}

export type ElementMarks = {
  /** The plan's element items; `viewOf` finds each mounted view (a failed mount has none). */
  sync(items: readonly ElementItem[], viewOf: (key: string) => TrackedView | undefined): void;
  /** One entry per element mark, in plan order (REQ-RND-005). */
  statuses(): MarkStatus[];
  dispose(): void;
};

type Watching = { readonly resolver: ElementResolver; readonly tracker: Tracker };

/**
 * Ties element views to their targets: the resolver finds the first match of each selector and
 * the tracker positions the views on it (REQ-RND-003, REQ-RND-005). Neither exists while the
 * plan has no element marks (REQ-RND-009). `onChange`: a target was found, lost or replaced.
 */
export function createElementMarks(onChange: () => void): ElementMarks {
  let items: readonly ElementItem[] = [];
  let viewOf: (key: string) => TrackedView | undefined = () => undefined;
  let watching: Watching | undefined;

  const track = ({ resolver, tracker }: Watching) => {
    tracker.track(
      items.flatMap((item) => {
        const view = viewOf(item.key);
        return view ? [{ target: resolver.targetOf(item.target.selector), view }] : [];
      }),
    );
  };
  const start = (): Watching => {
    const tracker = createTracker();
    const resolver = createElementResolver({
      onChange: () => {
        if (watching) track(watching);
        onChange();
      },
      onMutation: () => tracker.invalidate(),
    });
    return { resolver, tracker };
  };
  const stop = () => {
    watching?.resolver.dispose();
    watching?.tracker.dispose();
    watching = undefined;
  };

  return {
    sync(nextItems, nextViewOf) {
      items = nextItems;
      viewOf = nextViewOf;
      if (items.length === 0) return stop();
      watching ??= start();
      watching.resolver.watch(items.map((item) => item.target.selector));
      track(watching);
    },
    statuses() {
      const found = new Map<MarkId, boolean>();
      for (const item of items) {
        const target = watching?.resolver.targetOf(item.target.selector);
        for (const markId of item.markIds) if (!found.has(markId)) found.set(markId, !!target);
      }
      return [...found].map(([markId, isFound]) => ({ markId, found: isFound }));
    },
    dispose() {
      items = [];
      stop();
    },
  };
}
