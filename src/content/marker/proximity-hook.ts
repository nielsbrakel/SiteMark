import { notImplemented } from '../../core/not-implemented';
import type { ProximityFade } from './proximity';
import type { ViewMountHook } from './view-set';

/**
 * Hands the fading parts of every ribbon and banner view to one proximity fade (REQ-RND-013). The
 * fade (and its pointer listener) exists only while such a view is mounted, so an idle tab
 * doesn't listen at all (REQ-RND-009).
 */
export function proximityOnMount(_create: () => ProximityFade): ViewMountHook {
  return notImplemented();
}
