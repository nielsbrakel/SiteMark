import { err, ok } from '../../core/result';
import type { MarkerRegistration, ScriptRegistrar } from '../ports';

export type InMemoryScriptRegistrar = ScriptRegistrar & {
  /** The registration right now, like `scripting.getRegisteredContentScripts()`. */
  readonly current: MarkerRegistration | undefined;
};

const copy = (registration: MarkerRegistration): MarkerRegistration => ({
  matches: [...registration.matches],
});

/** A ScriptRegistrar fake that fails like Chromium on duplicate or missing registrations. */
export function createInMemoryScriptRegistrar(
  initial?: MarkerRegistration,
): InMemoryScriptRegistrar {
  let current = initial && copy(initial);
  return {
    getRegistered: async () => current && copy(current),
    register: async (registration) => {
      if (current) return err('registrationFailed');
      current = copy(registration);
      return ok(undefined);
    },
    update: async (registration) => {
      if (!current) return err('registrationFailed');
      current = copy(registration);
      return ok(undefined);
    },
    unregister: async () => {
      if (!current) return err('registrationFailed');
      current = undefined;
      return ok(undefined);
    },
    get current() {
      return current && copy(current);
    },
  };
}
