import { describe, expect, it } from 'vitest';
import config from '../../wxt.config';

type ViteHook = Extract<NonNullable<typeof config.vite>, (...args: never[]) => unknown>;

/** The `__SHADOW_MODE__` define that wxt.config.ts produces for a Vite mode. */
function shadowModeFor(mode: string): unknown {
  const env: Parameters<ViteHook>[0] = {
    mode,
    command: 'build',
    browser: 'chrome',
    manifestVersion: 3,
  };
  const vite = typeof config.vite === 'function' ? config.vite(env) : undefined;
  const define = (vite as { define?: Record<string, string> } | undefined)?.define;
  return define && JSON.parse(define.__SHADOW_MODE__ ?? 'null');
}

// The built production output is scanned in tests/build/shadow-mode.test.ts.
describe('REQ-RND-001 the marker shadow root is closed only in production (D-226)', () => {
  it('production builds use closed', () => {
    expect(shadowModeFor('production')).toBe('closed');
  });

  it.each(['development', 'e2e', 'test'])('%s builds use open so tests can pierce it', (mode) => {
    expect(shadowModeFor(mode)).toBe('open');
  });
});
