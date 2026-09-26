import { assertNever } from '../../core/result';
import type { Tabs } from '../ports';
import { flashRestricted, type StartPickerDeps, startPicker } from './start-picker';
import { toggleHidden } from './toggle-hidden';

/** The manifest's commands (REQ-CMD-001, REQ-CMD-002). */
export type CommandName = 'start-picker' | 'toggle-hide';

export type KeyboardCommandDeps = Omit<StartPickerDeps, 'tabs'> & { readonly tabs: Tabs };

/** Runs a keyboard command on a tab; start-picker shows "✕" where it can't run. */
export async function runKeyboardCommand(
  deps: KeyboardCommandDeps,
  name: CommandName,
  tabId: number,
): Promise<void> {
  switch (name) {
    case 'start-picker': {
      const started = await startPicker(deps, { tabId });
      if (!started.ok) await flashRestricted(deps.badge, tabId);
      return;
    }
    case 'toggle-hide':
      return toggleHidden(deps.tabs, tabId);
    default:
      return assertNever(name);
  }
}
