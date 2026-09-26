import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Theme } from '../../core/model/schema';
import { useTheme } from './use-theme';

/** A controllable `(prefers-color-scheme: dark)` media query. */
function osPrefersDark(initial: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const query = {
    matches: initial,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.delete(listener),
  };
  const matchMedia = vi
    .spyOn(window, 'matchMedia')
    .mockReturnValue(query as unknown as MediaQueryList);
  const change = (matches: boolean) =>
    act(() => {
      query.matches = matches;
      for (const listener of listeners) listener({ matches } as MediaQueryListEvent);
    });
  return { listeners, matchMedia, change };
}

const htmlTheme = () => document.documentElement.getAttribute('data-theme');

afterEach(() => document.documentElement.removeAttribute('data-theme'));

describe('REQ-THEME-001 pages follow the OS color scheme unless settings override it', () => {
  it.each(['light', 'dark'] as const)('forces %s from settings', (theme) => {
    osPrefersDark(theme === 'light');
    const { result } = renderHook(() => useTheme(theme));
    expect(result.current).toBe(theme);
    expect(htmlTheme()).toBe(theme);
  });

  it('follows the OS for system, live', () => {
    const os = osPrefersDark(true);
    const { result } = renderHook(() => useTheme('system'));
    expect(os.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    expect(result.current).toBe('dark');
    expect(htmlTheme()).toBe('dark');
    os.change(false);
    expect(result.current).toBe('light');
    expect(htmlTheme()).toBe('light');
  });

  it('follows the OS while the settings are still loading', () => {
    osPrefersDark(false);
    const { result } = renderHook(() => useTheme(undefined));
    expect(result.current).toBe('light');
    expect(htmlTheme()).toBe('light');
  });

  it('switches when the setting changes and stops listening to the OS once overridden', () => {
    const os = osPrefersDark(false);
    const { rerender } = renderHook(({ theme }: { theme: Theme }) => useTheme(theme), {
      initialProps: { theme: 'system' },
    });
    expect(os.listeners.size).toBe(1);
    rerender({ theme: 'dark' });
    expect(htmlTheme()).toBe('dark');
    expect(os.listeners.size).toBe(0);
    os.change(false);
    expect(htmlTheme()).toBe('dark');
  });

  it('stops listening when the page unmounts', () => {
    const os = osPrefersDark(false);
    const { unmount } = renderHook(() => useTheme('system'));
    unmount();
    expect(os.listeners.size).toBe(0);
  });
});
