/**
 * Runs a theme change inside a view transition, so the whole page cross-fades from one paper to the
 * other instead of flashing. Browsers without view transitions, and people who prefer reduced motion,
 * get the plain change.
 */
export function withThemeFade(change: () => void): void {
  const canFade =
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (canFade) document.startViewTransition(change);
  else change();
}
