import { notImplemented } from '@/core/not-implemented';
import type { FakeEvent } from './event';

export type Permissions = { permissions?: string[]; origins?: string[] };

export type FakePermissionsApi = {
  request(permissions: Permissions): Promise<boolean>;
  contains(permissions: Permissions): Promise<boolean>;
  remove(permissions: Permissions): Promise<boolean>;
  getAll(): Promise<Required<Permissions>>;
  onAdded: FakeEvent<[Required<Permissions>]>;
  onRemoved: FakeEvent<[Required<Permissions>]>;
};

export type FakePermissions = {
  api: FakePermissionsApi;
  /** Origins granted right now, in grant order. */
  readonly granted: readonly string[];
  /** Origins of every `request()` call, in order. */
  readonly requests: readonly (readonly string[])[];
  /** The user's answer to the next prompt. Later prompts are granted again. */
  answerNextRequest(answer: 'grant' | 'deny'): void;
  /** The user grants in the browser's own UI (Safari, site settings). */
  grant(...origins: string[]): void;
  /** The user revokes in the browser's own UI. */
  revoke(...origins: string[]): void;
};

export function createFakePermissions(_options: { granted?: string[] } = {}): FakePermissions {
  return notImplemented();
}
