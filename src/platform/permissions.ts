import { browser } from 'wxt/browser';
import type { Logger, Permissions, Unsubscribe } from '../app/ports';

type Change = { origins?: string[] };
type ChangeEvent = {
  addListener(callback: (change: Change) => void): void;
  removeListener(callback: (change: Change) => void): void;
};

/** Forwards changes that carry origins (API permissions never do for SiteMark). */
function subscribe(event: ChangeEvent, listener: (origins: string[]) => void): Unsubscribe {
  const callback = ({ origins = [] }: Change) => {
    if (origins.length > 0) listener(origins);
  };
  event.addListener(callback);
  return () => event.removeListener(callback);
}

/** The Permissions adapter over `browser.permissions`, always live (REQ-PRIV-002). */
export function createPermissions(logger: Logger): Permissions {
  const orNo = (action: string) => (error: unknown) => {
    logger.warn(`Could not ${action} host permissions`, error);
    return false;
  };
  return {
    contains: (origins) =>
      browser.permissions.contains({ origins: [...origins] }).catch(orNo('check')),
    getAll: async () => (await browser.permissions.getAll()).origins ?? [],
    remove: (origins) =>
      browser.permissions.remove({ origins: [...origins] }).catch(orNo('remove')),
    onAdded: (listener) => subscribe(browser.permissions.onAdded, listener),
    onRemoved: (listener) => subscribe(browser.permissions.onRemoved, listener),
  };
}

/** `failed`: the browser threw, e.g. no user gesture; the caller falls back to grant.html. */
export type RequestOutcome = 'granted' | 'denied' | 'failed';

/**
 * Prompts for host permissions (REQ-PRIV-002, D-229). Call it FIRST and synchronously in the click
 * handler of an extension page, before any `await`: it calls `permissions.request` right away.
 */
export function requestOrigins(origins: readonly string[]): Promise<RequestOutcome> {
  if (origins.length === 0) return Promise.resolve('granted');
  try {
    return browser.permissions
      .request({ origins: [...new Set(origins)] })
      .then((granted): RequestOutcome => (granted ? 'granted' : 'denied'))
      .catch((): RequestOutcome => 'failed');
  } catch {
    return Promise.resolve('failed');
  }
}
