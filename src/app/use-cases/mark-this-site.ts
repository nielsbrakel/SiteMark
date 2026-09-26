import type { ErrorCode } from '../../core/errors';
import type { Result } from '../../core/result';
import type { CommandQueue, Committed } from '../command-queue';
import type { Tabs } from '../ports';
import type { MarkThisSiteRequest } from '../protocol';
import { completeGrant, type GrantDeps } from './grant';

// "Mark this site" (REQ-POP-006, D-201, D-229). The popup prompts for the origin first and
// synchronously, then sends markThisSite without awaiting the prompt (src/platform/
// mark-this-site-click.ts). The background owns the rest, so it doesn't matter whether the popup
// closes: it injects the marker into the popup's tab itself. Opening the popup gave the extension
// activeTab on that tab, which lets the background inject there whether or not the origin is
// granted, and the marker then fetches its plan with the new ribbon ("until reload" when denied).

export type MarkThisSiteDeps = GrantDeps & { readonly queue: Pick<CommandQueue, 'dispatch'> };

/** The other tabs: completeGrant covers them, the popup's tab is injected once, explicitly. */
function otherTabs(tabs: GrantDeps['tabs'], tabId: number): GrantDeps['tabs'] {
  const list: Tabs['list'] = async () => (await tabs.list()).filter((tab) => tab.id !== tabId);
  return { list, inject: tabs.inject };
}

/**
 * Adds the default group for the origin, shows it on the tab, and completes the grant in case the
 * user already allowed the origin (its onAdded may have fired before the group existed). When the
 * grant comes later, watchPermissions completes it.
 */
export async function markThisSite(
  deps: MarkThisSiteDeps,
  { tabId, origin }: MarkThisSiteRequest,
): Promise<Result<Committed, ErrorCode>> {
  const committed = await deps.queue.dispatch({ type: 'markThisSite', origin });
  if (!committed.ok) return committed;
  // A page where scripts can't run refuses; the group is added all the same.
  await deps.tabs.inject(tabId, deps.markerFiles);
  await completeGrant({ ...deps, tabs: otherTabs(deps.tabs, tabId) }, [`*://${origin.hostname}/*`]);
  return committed;
}
