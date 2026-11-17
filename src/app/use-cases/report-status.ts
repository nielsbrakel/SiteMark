import type { TabStatus } from '../../core/render/status';
import { hasOffGroup } from '../../core/url/off-groups';
import type { Badge, BadgeState, StateRepo, Tabs } from '../ports';
import type { ContentSender } from '../protocol';

// The toolbar sticker from the status each marker reports (TabStatus, src/core/render/status.ts).

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

/**
 * What the tab's toolbar icon shows (REQ-POP-010, REQ-POP-007): `attention` beats `hidden` beats
 * `active`, and a tab with no active site group has the plain icon.
 */
export function toolbarState(status: TabStatus, readOnly: boolean): BadgeState {
  if (readOnly || !canFullyRender(status)) return 'attention';
  if (!status.active) return 'none';
  return status.hidden ? 'hidden' : 'active';
}

/**
 * Sets the tab's toolbar sticker from the marker's latest status (REQ-POP-010, D-219). A marker with
 * nothing active leaves the grey sticker where a site group is switched off (D-304).
 */
export async function reportStatus(
  deps: ReportStatusDeps,
  { tabId, url }: Pick<ContentSender, 'tabId' | 'url'>,
  status: TabStatus,
): Promise<void> {
  const { mode, state } = await deps.stateRepo.load();
  const shown = toolbarState(status, mode === 'readOnly');
  await deps.badge.setState(tabId, shown === 'none' && hasOffGroup(state, url) ? 'hidden' : shown);
}

/** On start with read-only data (REQ-DATA-007): the attention sticker on every open tab. */
export async function showReadOnlyBadges(
  deps: ReportStatusDeps & { readonly tabs: Pick<Tabs, 'list'> },
): Promise<void> {
  if (!(await isReadOnly(deps.stateRepo))) return;
  const tabs = await deps.tabs.list();
  await Promise.all(tabs.map((tab) => deps.badge.setState(tab.id, 'attention')));
}
