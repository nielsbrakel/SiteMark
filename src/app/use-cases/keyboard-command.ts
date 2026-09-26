import { notImplemented } from '../../core/not-implemented';
import type { Tabs } from '../ports';
import type { StartPickerDeps } from './start-picker';

/** The manifest's commands (REQ-CMD-001, REQ-CMD-002). */
export type CommandName = 'start-picker' | 'toggle-hide';

export type KeyboardCommandDeps = Omit<StartPickerDeps, 'tabs'> & { readonly tabs: Tabs };

/** Runs a keyboard command on a tab. */
export async function runKeyboardCommand(
  _deps: KeyboardCommandDeps,
  _name: CommandName,
  _tabId: number,
): Promise<void> {
  return notImplemented();
}
