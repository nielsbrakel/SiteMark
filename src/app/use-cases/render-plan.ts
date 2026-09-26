import type { SiteMarkState } from '../../core/model/schema';
import { compose } from '../../core/render/compose';
import type { RenderPlan } from '../../core/render/render-plan';
import type { StateRepo, Tabs } from '../ports';
import { tabMessage } from '../protocol';

// Need-to-know (D-221, REQ-SEC-002): a content script only ever receives the render plan for its
// own URL, which the background takes from the message sender. Nothing else of the state leaves the
// background.

/** The render plan for a content script's own URL (the sender's, REQ-SEC-002). */
export async function renderPlanFor(repo: StateRepo, url: string): Promise<RenderPlan> {
  // Read-only and recovered loads carry emptyState(), so those tabs render nothing.
  const { state } = await repo.load();
  return compose(url, state);
}

/**
 * Sends every tab the background can see its new plan, right after a commit (REQ-RND-007). Without
 * the `tabs` permission a tab's URL is visible only on granted origins, which are exactly the tabs
 * that can host the marker. A tab without a marker doesn't answer; that is fine. Tabs whose plan
 * became empty get it too, so their marks disappear.
 */
export async function pushPlans(tabs: Tabs, state: SiteMarkState): Promise<void> {
  const visible = await tabs.list();
  await Promise.all(
    visible.flatMap(({ id, url }) =>
      url === undefined ? [] : [tabs.sendMessage(id, tabMessage('applyPlan', compose(url, state)))],
    ),
  );
}
