import type { MarkId } from '../../core/ids';
import { notImplemented } from '../../core/not-implemented';
import type { Badge, StateRepo, Tabs } from '../ports';

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

/** Shows or clears the tab's "!" badge from the marker's latest status (REQ-POP-007, D-219). */
export function reportStatus(
  _deps: ReportStatusDeps,
  _tabId: number,
  _status: TabRenderStatus,
): Promise<void> {
  return notImplemented();
}

/** On start with read-only data (REQ-DATA-007): a "!" on every open tab. */
export function showReadOnlyBadges(
  _deps: ReportStatusDeps & { readonly tabs: Pick<Tabs, 'list'> },
): Promise<void> {
  return notImplemented();
}
