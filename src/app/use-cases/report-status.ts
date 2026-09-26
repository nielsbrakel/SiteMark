import type { MarkId } from '../../core/ids';
import type { Badge, BadgeText, StateRepo, Tabs } from '../ports';

// The minimal status input the badge needs. TODO(T-064…T-066): reconcile with the MarkStatus /
// TabStatus types of the message protocol (src/core/render/status.ts) once both are on main.

/** Whether the marker found the element of an element mark (REQ-RND-005). */
export type ElementMarkStatus = { readonly markId: MarkId; readonly found: boolean };

/** `off`: no active group tints the favicon; `unavailable`: it can't be tinted on this page. */
export type FaviconStatus = 'ok' | 'unavailable' | 'off';

/** What the marker in a tab reports after rendering its plan. */
export type TabRenderStatus = {
  readonly marks: readonly ElementMarkStatus[];
  readonly favicon: FaviconStatus;
};

export type ReportStatusDeps = {
  readonly badge: Badge;
  readonly stateRepo: Pick<StateRepo, 'load'>;
};

function canFullyRender(status: TabRenderStatus): boolean {
  return status.favicon !== 'unavailable' && status.marks.every((mark) => mark.found);
}

async function isReadOnly(stateRepo: ReportStatusDeps['stateRepo']): Promise<boolean> {
  return (await stateRepo.load()).mode === 'readOnly';
}

/** Shows or clears the tab's "!" badge from the marker's latest status (REQ-POP-007, D-219). */
export async function reportStatus(
  deps: ReportStatusDeps,
  tabId: number,
  status: TabRenderStatus,
): Promise<void> {
  const rendersFully = canFullyRender(status) && !(await isReadOnly(deps.stateRepo));
  const text: BadgeText = rendersFully ? '' : '!';
  await deps.badge.setText(tabId, text);
}

/** On start with read-only data (REQ-DATA-007): a "!" on every open tab. */
export async function showReadOnlyBadges(
  deps: ReportStatusDeps & { readonly tabs: Pick<Tabs, 'list'> },
): Promise<void> {
  if (!(await isReadOnly(deps.stateRepo))) return;
  const tabs = await deps.tabs.list();
  await Promise.all(tabs.map((tab) => deps.badge.setText(tab.id, '!')));
}
