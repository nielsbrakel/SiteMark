import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';

/** `loading` until the browser answers; `''` when the command has no shortcut. */
export type ShortcutState = { readonly status: 'loading' } | { readonly shortcut: string };

async function shortcutOf(name: string): Promise<string> {
  try {
    const commands = await browser.commands.getAll();
    return commands.find((command) => command.name === name)?.shortcut ?? '';
  } catch {
    return '';
  }
}

/** The shortcut the user assigned to a manifest command, read from `commands.getAll()` (REQ-CMD-002). */
export function useShortcut(name: string): ShortcutState {
  const [state, setState] = useState<ShortcutState>({ status: 'loading' });
  useEffect(() => {
    let isCurrent = true;
    void shortcutOf(name).then((shortcut) => {
      if (isCurrent) setState({ shortcut });
    });
    return () => {
      isCurrent = false;
    };
  }, [name]);
  return state;
}
