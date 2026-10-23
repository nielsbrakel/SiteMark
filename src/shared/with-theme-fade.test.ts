import { afterEach, describe, expect, it, vi } from 'vitest';
import { withThemeFade } from './with-theme-fade';

const prefersReducedMotion = (matches: boolean) =>
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches } as MediaQueryList);

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(document, 'startViewTransition');
});

describe('REQ-THEME-001 a theme change cross-fades the page', () => {
  it('runs the change inside a view transition', () => {
    prefersReducedMotion(false);
    const start = vi.fn();
    Object.assign(document, { startViewTransition: start });
    const change = vi.fn();
    withThemeFade(change);
    expect(start).toHaveBeenCalledWith(change);
    expect(change).not.toHaveBeenCalled();
  });

  it('changes at once for reduced motion', () => {
    prefersReducedMotion(true);
    const start = vi.fn();
    Object.assign(document, { startViewTransition: start });
    const change = vi.fn();
    withThemeFade(change);
    expect(start).not.toHaveBeenCalled();
    expect(change).toHaveBeenCalledOnce();
  });

  it('changes at once where view transitions do not exist', () => {
    prefersReducedMotion(false);
    const change = vi.fn();
    withThemeFade(change);
    expect(change).toHaveBeenCalledOnce();
  });
});
