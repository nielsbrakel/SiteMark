import type { Logger, Permissions } from '../app/ports';
import { notImplemented } from '../core/not-implemented';

/** The Permissions adapter over `browser.permissions`, always live (REQ-PRIV-002). */
export function createPermissions(_logger: Logger): Permissions {
  return notImplemented();
}

/** `failed`: the browser threw, e.g. no user gesture; the caller falls back to grant.html. */
export type RequestOutcome = 'granted' | 'denied' | 'failed';

/**
 * Prompts for host permissions (REQ-PRIV-002, D-229). Call it FIRST and synchronously in the click
 * handler of an extension page, before any `await`: it calls `permissions.request` right away.
 */
export function requestOrigins(_origins: readonly string[]): Promise<RequestOutcome> {
  return notImplemented();
}
