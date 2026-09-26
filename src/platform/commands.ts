import type { Tabs, Unsubscribe } from '../app/ports';
import type { CommandName } from '../app/use-cases/keyboard-command';
import { notImplemented } from '../core/not-implemented';

/** The tab `commands.onCommand` passes along; missing in some browsers and contexts. */
export type CommandTab = { readonly id?: number | undefined };

/** Runs a command by its manifest name, on the given tab or else the active one. */
export type CommandDispatcher = (name: string, tab?: CommandTab) => Promise<void>;

/** Resolves the tab and ignores unknown commands (REQ-CMD-001). */
export function createCommandDispatcher(
  _run: (name: CommandName, tabId: number) => Promise<void>,
  _tabs: Pick<Tabs, 'active'>,
): CommandDispatcher {
  return notImplemented();
}

/** Registers the `commands.onCommand` listener; call it synchronously at the top level. */
export function listenForCommands(_dispatch: CommandDispatcher): Unsubscribe {
  return notImplemented();
}
