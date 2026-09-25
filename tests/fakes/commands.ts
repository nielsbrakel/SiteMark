import { createEvent, type FakeEvent } from './event';

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

export function createFakeCommands(commands: Command[] = []): FakeCommands {
  const state = new Map(commands.map((command) => [command.name, { ...command }]));
  const onCommand = createEvent<[name: string, tab?: CommandTab]>();
  return {
    api: {
      getAll: async () => [...state.values()].map((command) => ({ ...command })),
      onCommand,
    },
    setShortcut: (name, shortcut) => {
      const command = state.get(name);
      if (!command) throw new Error(`Unknown command: ${name}`);
      command.shortcut = shortcut;
    },
    press: (name, tab) => void onCommand.trigger(name, tab),
  };
}
