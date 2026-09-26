import { useCallback, useLayoutEffect, useSyncExternalStore } from 'react';
import type { Theme } from '../../core/model/schema';

export type ResolvedTheme = 'light' | 'dark';

const DARK_QUERY = '(prefers-color-scheme: dark)';

const prefersDark = () => window.matchMedia(DARK_QUERY).matches;

/** The OS color scheme, live while `isFollowing`; no listener otherwise. */
function useOsPrefersDark(isFollowing: boolean): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!isFollowing) return () => undefined;
      const query = window.matchMedia(DARK_QUERY);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    [isFollowing],
  );
  return useSyncExternalStore(subscribe, prefersDark, () => false);
}

/**
 * Applies the theme setting to a page (REQ-THEME-001): `light`/`dark` force it, `system` (and
 * `undefined` while the settings load) follows the OS color scheme live. Sets `data-theme` on
 * <html>, which tokens.css reads, and returns the theme in effect.
 */
export function useTheme(
  theme: Theme | undefined,
  root: HTMLElement = document.documentElement,
): ResolvedTheme {
  const isFollowingOs = theme === undefined || theme === 'system';
  const osPrefersDark = useOsPrefersDark(isFollowingOs);
  const resolved: ResolvedTheme = isFollowingOs ? (osPrefersDark ? 'dark' : 'light') : theme;
  useLayoutEffect(() => {
    root.setAttribute('data-theme', resolved);
  }, [root, resolved]);
  return resolved;
}
