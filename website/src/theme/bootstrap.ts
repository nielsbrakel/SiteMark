import { notImplemented } from '@/core/not-implemented';

/** The theme toggle's options: follow the OS, or force one theme (REQ-WEBUX-002). */
export type ThemeChoice = 'auto' | 'light' | 'dark';

/** Runs inline in <head> before first paint: applies the stored theme and marks JS as available. */
export function themeBootstrap(_root: HTMLElement): void {
  notImplemented();
}

/** The inline script, whose SHA-256 the CSP pins (REQ-WEB-005). */
export function bootstrapScript(): string {
  return notImplemented();
}

/** Remembers the toggle's choice under the website's only storage key (REQ-WEB-004). */
export function saveThemeChoice(_choice: ThemeChoice): void {
  notImplemented();
}
