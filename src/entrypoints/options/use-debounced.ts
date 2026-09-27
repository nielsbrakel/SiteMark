import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

/** How long autosave waits after the last keystroke or slider move (REQ-OPT-006). */
export const AUTOSAVE_MS = 500;

export type Debounced = {
  /** Runs the action once no call came for `delayMs`. */
  readonly schedule: () => void;
  /** Runs the action now (e.g. on blur) and drops a scheduled run. */
  readonly flush: () => void;
};

/**
 * Debounces `action` for autosave (REQ-OPT-006). A scheduled run calls the latest `action`, so it
 * sees the state of the render after the last change. Unmounting drops a scheduled run.
 */
export function useDebounced(action: () => void, delayMs = AUTOSAVE_MS): Debounced {
  const latest = useRef(action);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useLayoutEffect(() => {
    latest.current = action;
  });
  const cancel = useCallback(() => clearTimeout(timer.current), []);
  useEffect(() => cancel, [cancel]);
  return useMemo(
    () => ({
      schedule: () => {
        cancel();
        timer.current = setTimeout(() => latest.current(), delayMs);
      },
      flush: () => {
        cancel();
        latest.current();
      },
    }),
    [cancel, delayMs],
  );
}
