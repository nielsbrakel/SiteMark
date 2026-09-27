import { fadeNodesOf, type ProximityFade } from './proximity';
import type { ViewMountHook } from './view-set';

/**
 * Hands the fading parts of every ribbon and banner view to one proximity fade (REQ-RND-013). The
 * fade (and its pointer listener) exists only while such a view is mounted, so an idle tab
 * doesn't listen at all (REQ-RND-009).
 */
export function proximityOnMount(create: () => ProximityFade): ViewMountHook {
  let fade: ProximityFade | undefined;
  let nodes = 0;
  const release = (remove: () => void) => {
    remove();
    nodes--;
    if (nodes > 0) return;
    fade?.dispose();
    fade = undefined;
  };
  return (item, view, disposer) => {
    if (item.effect !== 'ribbon' && item.effect !== 'banner') return;
    fade ??= create();
    for (const node of fadeNodesOf(view.el)) {
      const remove = fade.add(node);
      nodes++;
      disposer.add(() => release(remove));
    }
  };
}
