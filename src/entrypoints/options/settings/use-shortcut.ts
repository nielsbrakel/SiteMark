import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';

/** Shortcut per manifest command name; `''` when the command has no shortcut. */
export type Shortcuts = ReadonlyMap<string, string>;

async function readShortcuts(): Promise<Shortcuts> {
  try {
    const commands = await browser.commands.getAll();
    return new Map(
      commands.flatMap(({ name, shortcut }) => (name ? [[name, shortcut ?? '']] : [])),
    );
  } catch {
    return new Map();
  }
}

/**
 * The shortcuts the user assigned to the manifest commands, read live from `commands.getAll()`
 * when the page opens (REQ-CMD-001, REQ-CMD-002). `undefined` until the browser answers.
 */
export function useShortcuts(): Shortcuts | undefined {
  const [shortcuts, setShortcuts] = useState<Shortcuts>();
  useEffect(() => {
    let isCurrent = true;
    void readShortcuts().then((read) => {
      if (isCurrent) setShortcuts(read);
    });
    return () => {
      isCurrent = false;
    };
  }, []);
  return shortcuts;
}
