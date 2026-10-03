import type { SiteMarkState } from '@/core/model/schema';
import { compose } from '@/core/render/compose';
import type { RenderPlan } from '@/core/render/render-plan';
import { PLAYGROUND_ADDRESS, playgroundGroup } from './playground-group';
import type { PlaygroundState } from './playground-state';

/**
 * The render plan a tab at the sample address would get (REQ-PLAY-002): the extension's own
 * `compose` over a state that holds only the playground's site group. Nothing is stored.
 */
export function playgroundPlan(state: PlaygroundState): RenderPlan {
  const siteMarkState: SiteMarkState = {
    schemaVersion: 1,
    revision: 0,
    siteGroups: state.enabled ? [playgroundGroup(state)] : [],
    settings: { theme: 'system' },
  };
  return compose(PLAYGROUND_ADDRESS, siteMarkState);
}
