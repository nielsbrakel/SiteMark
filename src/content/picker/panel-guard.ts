// Panel trust (REQ-SEC-005): the panel lives in a hostile page, so a click only counts when the
// browser says a person made it (`isTrusted`) and when it comes at least 500 ms after the panel
// appeared or moved, so a page can't trick a click that was aimed at something else onto it.

const ACTIVATION_DELAY_MS = 500;

export type TrustDeps = {
  /** `event.isTrusted` in production; replaceable in tests (happy-dom events are never trusted). */
  readonly isTrusted: (event: Event) => boolean;
  /** Milliseconds, e.g. `Date.now`. */
  readonly now: () => number;
};

export type ActivationGuard = {
  /** Starts the delay again: the panel just moved. */
  rearm(): void;
};

/**
 * Stops every click inside `element` that isn't trusted or comes too early, before any handler in
 * the panel sees it; its default action is cancelled too, and `onBlocked` puts back state that
 * not every engine restores (a whole radio group).
 */
export function guardActivation(
  element: HTMLElement,
  deps: TrustDeps,
  onBlocked: () => void,
): ActivationGuard {
  let armedAt = deps.now() + ACTIVATION_DELAY_MS;
  element.addEventListener(
    'click',
    (event) => {
      if (deps.isTrusted(event) && deps.now() >= armedAt) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onBlocked();
    },
    { capture: true },
  );
  return {
    rearm: () => {
      armedAt = deps.now() + ACTIVATION_DELAY_MS;
    },
  };
}
