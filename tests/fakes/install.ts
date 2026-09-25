import { fakeBrowser } from 'wxt/testing/fake-browser';
import { createFakeCommands, type FakeCommands } from './commands';
import { createFakeI18n, type FakeI18nApi } from './i18n';
import { createFakePermissions, type FakePermissions } from './permissions';
import { createFakeScripting, type FakeScripting } from './scripting';

export type Fakes = {
  permissions: FakePermissions;
  scripting: FakeScripting;
  i18n: { api: FakeI18nApi };
  commands: FakeCommands;
};

let current: Fakes | undefined;

/** Replaces the APIs WXT's fake browser lacks with fresh stateful fakes (tests/unit/setup.ts). */
export function installFakes(): Fakes {
  current = {
    permissions: createFakePermissions(),
    scripting: createFakeScripting(),
    i18n: createFakeI18n(),
    commands: createFakeCommands(),
  };
  for (const [name, fake] of Object.entries(current)) {
    Object.defineProperty(fakeBrowser, name, {
      value: fake.api,
      configurable: true,
      writable: true,
    });
  }
  return current;
}

/** The fakes installed for the current test. */
export function fakes(): Fakes {
  if (!current) throw new Error('installFakes() has not run: is tests/unit/setup.ts loaded?');
  return current;
}
