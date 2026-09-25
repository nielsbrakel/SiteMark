import { notImplemented } from '@/core/not-implemented';
import type { FakeEvent } from './event';

export type Command = { name: string; shortcut: string; description?: string };
export type CommandTab = { id: number; url?: string };

export type FakeCommandsApi = {
  getAll(): Promise<Command[]>;
  onCommand: FakeEvent<[name: string, tab?: CommandTab]>;
};

export type FakeCommands = {
  api: FakeCommandsApi;
  /** The user assigns a shortcut in the browser's shortcut settings. */
  setShortcut(name: string, shortcut: string): void;
  /** The user presses a command's shortcut. */
  press(name: string, tab?: CommandTab): void;
};

export function createFakeCommands(_commands: Command[] = []): FakeCommands {
  return notImplemented();
}
