import type { MarkId } from '../../core/ids';
import { ok, type Result } from '../../core/result';
import type { Badge, InjectionError, Tabs } from '../ports';
import { pickerMessage } from '../protocol';

// The picker is injected on demand (REQ-PICK-001): the popup's "Pick element" and the start-picker
// shortcut both give activeTab on the tab, so this works before any host permission exists. The
// picker keeps its own session; for a re-pick (REQ-PICK-007) the background tells the freshly
// injected picker which mark it replaces, and the picker sends that ID back with savePick, where
// the background checks it again. Nothing is remembered here (the service worker may stop).

export type StartPickerDeps = {
  readonly tabs: Pick<Tabs, 'inject' | 'sendMessage'>;
  readonly badge: Badge;
  /** The picker bundle (src/platform/picker-files.ts `pickerFiles()`). */
  readonly pickerFiles: readonly string[];
};

export type StartPickerRequest = { readonly tabId: number; readonly repickMarkId?: MarkId };

/** How long the "✕" badge stays (REQ-CMD-001: "briefly"). */
const RESTRICTED_BADGE_MS = 2000;

/**
 * Injects the picker into the tab (REQ-PICK-001). `injectionFailed` on pages where scripts can't
 * run, the ground truth for REQ-POP-005. Injecting it while it runs cancels it (picker-machine).
 */
export async function startPicker(
  deps: StartPickerDeps,
  { tabId, repickMarkId }: StartPickerRequest,
): Promise<Result<void, InjectionError>> {
  const injected = await deps.tabs.inject(tabId, deps.pickerFiles);
  if (!injected.ok) return injected;
  if (repickMarkId) {
    await deps.tabs.sendMessage(tabId, pickerMessage('repick', { markId: repickMarkId }));
  }
  return ok(undefined);
}

/** The "✕" badge, shown briefly on a page where the shortcut can't run (REQ-CMD-001). */
export async function flashRestricted(badge: Badge, tabId: number): Promise<void> {
  await badge.setText(tabId, '✕');
  // A page where scripts can't run has no marker, so there is no "!" to restore.
  setTimeout(() => void badge.setText(tabId, ''), RESTRICTED_BADGE_MS);
}
