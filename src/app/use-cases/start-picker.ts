import type { MarkId } from '../../core/ids';
import { notImplemented } from '../../core/not-implemented';
import type { Result } from '../../core/result';
import type { Badge, InjectionError, Tabs } from '../ports';

export type StartPickerDeps = {
  readonly tabs: Pick<Tabs, 'inject' | 'sendMessage'>;
  readonly badge: Badge;
  /** The picker bundle (src/platform/picker-files.ts `pickerFiles()`). */
  readonly pickerFiles: readonly string[];
};

export type StartPickerRequest = { readonly tabId: number; readonly repickMarkId?: MarkId };

/** Injects the picker into the tab (REQ-PICK-001), telling it which mark a re-pick replaces. */
export async function startPicker(
  _deps: StartPickerDeps,
  _request: StartPickerRequest,
): Promise<Result<void, InjectionError>> {
  return notImplemented();
}

/** The "✕" badge, shown briefly on a page where the shortcut can't run (REQ-CMD-001). */
export async function flashRestricted(_badge: Badge, _tabId: number): Promise<void> {
  return notImplemented();
}
