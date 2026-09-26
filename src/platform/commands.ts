import { browser } from 'wxt/browser';
import type { Tabs, Unsubscribe } from '../app/ports';
import type { CommandName } from '../app/use-cases/keyboard-command';

// Keyboard commands (REQ-CMD-001, REQ-CMD-002). The browser passes the tab the shortcut was pressed
// on, but not everywhere (older Firefox, some Safari versions): then the active tab is looked up.
// Pressing the shortcut grants activeTab on that tab, which is what lets the picker be injected.

/** The tab `commands.onCommand` passes along; missing in some browsers and contexts. */
export type CommandTab = { readonly id?: number | undefined };

/** Runs a command by its manifest name, on the given tab or else the active one. */
export type CommandDispatcher = (name: string, tab?: CommandTab) => Promise<void>;

const NAMES: Readonly<Record<CommandName, true>> = { 'start-picker': true, 'toggle-hide': true };

function commandName(name: string): CommandName | undefined {
  return Object.hasOwn(NAMES, name) ? (name as CommandName) : undefined;
}

/** Resolves the tab and ignores unknown commands (REQ-CMD-001). */
export function createCommandDispatcher(
  run: (name: CommandName, tabId: number) => Promise<void>,
  tabs: Pick<Tabs, 'active'>,
): CommandDispatcher {
  return async (name, tab) => {
    const command = commandName(name);
    if (!command) return;
    const tabId = tab?.id ?? (await tabs.active())?.id;
    if (tabId !== undefined) await run(command, tabId);
  };
}

/** Registers the `commands.onCommand` listener; call it synchronously at the top level. */
export function listenForCommands(dispatch: CommandDispatcher): Unsubscribe {
  const listener = (name: string, tab?: CommandTab) => void dispatch(name, tab);
  browser.commands.onCommand.addListener(listener);
  return () => browser.commands.onCommand.removeListener(listener);
}
