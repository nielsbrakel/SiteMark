import { notImplemented } from '../../core/not-implemented';
import type { MarkerRegistration, ScriptRegistrar } from '../ports';

export type InMemoryScriptRegistrar = ScriptRegistrar & {
  /** The registration right now, like `scripting.getRegisteredContentScripts()`. */
  readonly current: MarkerRegistration | undefined;
};

/** A ScriptRegistrar fake that fails like Chromium on duplicate or missing registrations. */
export function createInMemoryScriptRegistrar(
  _initial?: MarkerRegistration,
): InMemoryScriptRegistrar {
  return notImplemented();
}
