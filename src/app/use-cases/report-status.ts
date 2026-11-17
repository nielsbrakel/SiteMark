import type { TabStatus } from '../../core/render/status';
import type { Badge, StateRepo, Tabs } from '../ports';

// The toolbar badge from the status each marker reports (TabStatus, src/core/render/status.ts).

export type ReportStatusDeps = {
  readonly badge: Badge;
  readonly stateRepo: Pick<StateRepo, 'load'>;
};

function canFullyRender(status: TabStatus): boolean {
  return status.favicon !== 'unavailable' && status.marks.every((mark) => mark.found);
}

async function isReadOnly(stateRepo: ReportStatusDeps['stateRepo']): Promise<boolean> {
  return (await stateRepo.load()).mode === 'readOnly';
}

/** Shows or clears the tab's "!" badge from the marker's latest status (REQ-POP-007, D-219). */
export async function reportStatus(
  deps: ReportStatusDeps,
  tabId: number,
  status: TabStatus,
): Promise<void> {
  const rendersFully = canFullyRender(status) && !(await isReadOnly(deps.stateRepo));
  await deps.badge.setState(tabId, rendersFully ? 'none' : 'attention');
}

/** On start with read-only data (REQ-DATA-007): the attention sticker on every open tab. */
export async function showReadOnlyBadges(
  deps: ReportStatusDeps & { readonly tabs: Pick<Tabs, 'list'> },
): Promise<void> {
  if (!(await isReadOnly(deps.stateRepo))) return;
  const tabs = await deps.tabs.list();
  await Promise.all(tabs.map((tab) => deps.badge.setState(tab.id, 'attention')));
}
