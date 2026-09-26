import { type Browser, browser } from 'wxt/browser';
import type { Logger, MarkerRegistration, RegistrationError, ScriptRegistrar } from '../app/ports';
import { err, ok, type Result } from '../core/result';

const MARKER_ID = 'sitemark-marker';
/** WXT's output for src/entrypoints/content.ts (`registration: 'runtime'`); tests/build checks it. */
const MARKER_FILES = ['content-scripts/content.js'] as const;

type Script = Browser.scripting.RegisteredContentScript;

/** The files of the marker content script (the `content` entrypoint, `registration: 'runtime'`). */
export function markerFiles(): readonly string[] {
  return MARKER_FILES;
}

/**
 * The fixed options (plan §3.2). `matchOriginAsFallback` is left at its default (false) instead of
 * being passed, since not every browser accepts the key; `excludeMatches` is never used (D-231).
 */
function markerScript({ matches }: MarkerRegistration) {
  return {
    id: MARKER_ID,
    matches: [...matches],
    js: [...MARKER_FILES],
    runAt: 'document_start',
    allFrames: false,
    persistAcrossSessions: true,
    world: 'ISOLATED',
  } satisfies Script;
}

/** Was the script registered with this build's file and options? */
function isCurrent(script: Script): boolean {
  const js = script.js ?? [];
  return (
    js.length === MARKER_FILES.length &&
    MARKER_FILES.every((file, index) => js[index] === file) &&
    (script.runAt ?? 'document_start') === 'document_start' &&
    !script.allFrames &&
    (script.world ?? 'ISOLATED') === 'ISOLATED'
  );
}

/**
 * The ScriptRegistrar adapter over `browser.scripting` (D-231). A registration left by a build with
 * another file or options reads as having no matches, so the next sync rewrites it.
 */
export function createScriptRegistrar(logger: Logger): ScriptRegistrar {
  const attempt =
    (action: string) =>
    (call: Promise<unknown>): Promise<Result<void, RegistrationError>> =>
      call.then(
        () => ok(undefined),
        (error: unknown) => {
          logger.warn(`Could not ${action} the marker`, error);
          return err('registrationFailed');
        },
      );
  return {
    getRegistered: async () => {
      try {
        const [script] = await browser.scripting.getRegisteredContentScripts({ ids: [MARKER_ID] });
        return script && { matches: isCurrent(script) ? (script.matches ?? []) : [] };
      } catch (error) {
        logger.warn('Could not read the marker registration', error);
        return undefined;
      }
    },
    register: (registration) =>
      attempt('register')(browser.scripting.registerContentScripts([markerScript(registration)])),
    update: (registration) =>
      attempt('update')(browser.scripting.updateContentScripts([markerScript(registration)])),
    unregister: () =>
      attempt('unregister')(browser.scripting.unregisterContentScripts({ ids: [MARKER_ID] })),
  };
}
