import { notImplemented } from '../../core/not-implemented';
import type { TabStatus } from '../../core/render/status';
import type { Badge, BadgeState, StateRepo, Tabs } from '../ports';

// The toolbar sticker from the status each marker reports (TabStatus, src/core/render/status.ts).

export type ReportStatusDeps = {
  readonly badge: Badge;
  readonly stateRepo: Pick<StateRepo, 'load'>;
};

async function isReadOnly(stateRepo: ReportStatusDeps['stateRepo']): Promise<boolean> {
  return (await stateRepo.load()).mode === 'readOnly';
}

/**
 * What the tab's toolbar icon shows (REQ-POP-010, REQ-POP-007): `attention` beats `hidden` beats
 * `active`, and a tab with no active site group has the plain icon.
 */
export function toolbarState(_status: TabStatus, _readOnly: boolean): BadgeState {
  return notImplemented();
}

/** Sets the tab's toolbar sticker from the marker's latest status (REQ-POP-010, D-219). */
export async function reportStatus(
  deps: ReportStatusDeps,
  tabId: number,
  status: TabStatus,
): Promise<void> {
  await deps.badge.setState(tabId, toolbarState(status, await isReadOnly(deps.stateRepo)));
}

/** On start with read-only data (REQ-DATA-007): the attention sticker on every open tab. */
export async function showReadOnlyBadges(
  deps: ReportStatusDeps & { readonly tabs: Pick<Tabs, 'list'> },
): Promise<void> {
  if (!(await isReadOnly(deps.stateRepo))) return;
  const tabs = await deps.tabs.list();
  await Promise.all(tabs.map((tab) => deps.badge.setState(tab.id, 'attention')));
}
