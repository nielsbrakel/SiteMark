import type { SiteGroupId } from '../../core/ids';
import type { Theme } from '../../core/model/schema';
import { notImplemented } from '../../core/not-implemented';
import type { StateRepo } from '../ports';

/** A site group the panel offers: one that is active on the sender's URL. */
export type PickerGroup = { readonly id: SiteGroupId; readonly name: string };

/** What the picker's mini panel needs from the state (REQ-PICK-005, REQ-THEME-001). */
export type PickerContext = {
  readonly groups: readonly PickerGroup[];
  readonly theme: Theme;
};

/** The panel's choices for the sender's own URL, and nothing else of the state (D-221). */
export async function pickerContext(_repo: StateRepo, _url: string): Promise<PickerContext> {
  return notImplemented();
}
