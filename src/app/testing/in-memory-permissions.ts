import { notImplemented } from '../../core/not-implemented';
import type { Permissions } from '../ports';

export type InMemoryPermissions = Permissions & {
  /** Origins granted right now, in grant order. */
  readonly granted: readonly string[];
  /** The user grants in the browser's own UI (or a prompt elsewhere): fires onAdded. */
  grant(...origins: string[]): void;
  /** The user revokes in the browser's own UI: fires onRemoved. */
  revoke(...origins: string[]): void;
};

/** A Permissions fake, keeping tests/contracts/permissions-contract.ts. */
export function createInMemoryPermissions(_granted: readonly string[] = []): InMemoryPermissions {
  return notImplemented();
}
