/**
 * The "picker already running" flag (plan §3.4). Like the marker's guard it lives on the content
 * script's global (the isolated world), which every injection of the bundle shares although its
 * module state is new, and which the page can't see.
 */
const GUARD = Symbol.for('sitemark.picker.instance');

type GuardedGlobal = { [GUARD]?: () => void };

/**
 * Invoking the picker while it runs cancels it (REQ-PICK-001, picker-machine `invoke`). Returns
 * `undefined` after cancelling the running picker; otherwise registers `cancel` as the running one
 * and returns the function that clears the flag when this picker ends.
 */
export function claimPicker(cancel: () => void): (() => void) | undefined {
  const scope = globalThis as GuardedGlobal;
  const running = scope[GUARD];
  if (running) {
    delete scope[GUARD];
    try {
      running();
    } catch {
      // A broken predecessor is gone all the same.
    }
    return undefined;
  }
  scope[GUARD] = cancel;
  return () => {
    if (scope[GUARD] === cancel) delete scope[GUARD];
  };
}
