import type { Logger, ScriptRegistrar } from '../app/ports';
import { notImplemented } from '../core/not-implemented';

/** The files of the marker content script (the `content` entrypoint, `registration: 'runtime'`). */
export function markerFiles(): readonly string[] {
  return notImplemented();
}

/** The ScriptRegistrar adapter over `browser.scripting` (D-231). */
export function createScriptRegistrar(_logger: Logger): ScriptRegistrar {
  return notImplemented();
}
