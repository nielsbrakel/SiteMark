import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import type { CommandName } from '@/app/use-cases/keyboard-command';

/** The assigned shortcut per command; a command without one is left out (D-208). */
export type Shortcuts = Partial<Record<CommandName, string>>;

const NAMES: readonly CommandName[] = ['start-picker', 'toggle-hide'];

async function readShortcuts(): Promise<Shortcuts> {
  try {
    const commands = await browser.commands.getAll();
    const assigned = commands.flatMap(({ name, shortcut }) =>
      NAMES.includes(name as CommandName) && shortcut ? [[name, shortcut] as const] : [],
    );
    return Object.fromEntries(assigned);
  } catch {
    return {};
  }
}

/** The live keyboard shortcuts from `commands.getAll()` (REQ-POP-003, REQ-CMD-001). */
export function useShortcuts(): Shortcuts {
  const [shortcuts, setShortcuts] = useState<Shortcuts>({});
  useEffect(() => {
    let isCurrent = true;
    void readShortcuts().then((found) => {
      if (isCurrent) setShortcuts(found);
    });
    return () => {
      isCurrent = false;
    };
  }, []);
  return shortcuts;
}
