import type { SiteMarkState } from '../../core/model/schema';
import { notImplemented } from '../../core/not-implemented';
import type { RenderPlan } from '../../core/render/render-plan';
import type { StateRepo, Tabs } from '../ports';

/** The render plan for a content script's own URL (the sender's, REQ-SEC-002). */
export function renderPlanFor(_repo: StateRepo, _url: string): Promise<RenderPlan> {
  return notImplemented();
}

/** Sends every tab the background can see its new plan (REQ-RND-007). */
export function pushPlans(_tabs: Tabs, _state: SiteMarkState): Promise<void> {
  return notImplemented();
}
