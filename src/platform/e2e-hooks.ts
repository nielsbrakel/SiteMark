import type { CommandDispatcher } from './commands';

/** What `tests/e2e/background.ts` calls through Playwright's service-worker `evaluate`. */
type E2eHooks = { readonly dispatchCommand: (name: string) => Promise<void> };

/**
 * Exposes test hooks on the service worker's global scope, for `wxt build --mode e2e` only: the
 * caller checks `import.meta.env.MODE`, so production builds drop this code. A keyboard shortcut
 * can't be pressed from Playwright, so `dispatchCommand` runs a command like the shortcut would,
 * on the active tab.
 */
export function exposeE2eHooks(dispatch: CommandDispatcher): void {
  const hooks: E2eHooks = { dispatchCommand: (name) => dispatch(name) };
  Object.assign(globalThis, { sitemarkE2e: hooks });
}
