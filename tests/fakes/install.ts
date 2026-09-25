import { notImplemented } from '@/core/not-implemented';
import type { FakeCommands } from './commands';
import type { FakeI18nApi } from './i18n';
import type { FakePermissions } from './permissions';
import type { FakeScripting } from './scripting';

export type Fakes = {
  permissions: FakePermissions;
  scripting: FakeScripting;
  i18n: { api: FakeI18nApi };
  commands: FakeCommands;
};

/** Replaces the APIs WXT's fake browser lacks with fresh stateful fakes (tests/unit/setup.ts). */
export function installFakes(): Fakes {
  return notImplemented();
}

/** The fakes installed for the current test. */
export function fakes(): Fakes {
  return notImplemented();
}
