/**
 * The "already running" guard (REQ-RND-012, REQ-SEC-006). It lives on the content script's global,
 * which is the isolated world: pages can't see or fake it, and a second injection of the bundle
 * (registration, executeScript after a grant, activeTab) finds it although its module state is new.
 */
const GUARD = Symbol.for('sitemark.marker.instance');

type GuardedGlobal = { [GUARD]?: () => void };

/**
 * Disposes the instance that is running, if any, and makes `dispose` the current one. The returned
 * release function clears the guard only while it still points at this instance.
 */
export function claimInstance(dispose: () => void): () => void {
  const scope = globalThis as GuardedGlobal;
  const previous = scope[GUARD];
  try {
    previous?.();
  } catch {
    // A broken predecessor must not stop the new instance.
  }
  scope[GUARD] = dispose;
  return () => {
    if (scope[GUARD] === dispose) delete scope[GUARD];
  };
}
