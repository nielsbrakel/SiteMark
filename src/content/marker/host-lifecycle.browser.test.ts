import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  aHost,
  cleanUp,
  elementOf,
  plantedRoot,
  settle,
  track,
} from '../../../tests/browser/host-harness';

afterEach(() => {
  cleanUp();
  vi.useRealTimers();
});

/** Our hosts on the page: `<sitemark-root>` elements with a shadow root (open in tests). */
const liveHosts = () =>
  [...document.documentElement.children].filter(
    (element) => element.localName === 'sitemark-root' && element.shadowRoot,
  );

describe('REQ-RND-012 one marker host per document', () => {
  it('a new host disposes the previous one', () => {
    const onDispose = vi.fn();
    const first = aHost({ onDispose });
    const second = aHost();
    expect(onDispose).toHaveBeenCalledTimes(1);
    expect(elementOf(first).isConnected).toBe(false);
    expect(liveHosts()).toEqual([elementOf(second)]);
  });

  it('finds the previous instance through a guard that outlives the module (re-injection)', async () => {
    const onDispose = vi.fn();
    const first = aHost({ onDispose });
    // A second evaluation of the bundle gets fresh module state, like a second injection does.
    const specifier = './host.ts?reinjected';
    const reinjected: typeof import('./host') = await import(/* @vite-ignore */ specifier);
    const second = track(reinjected.createHost({ isAlive: () => true }));
    expect(onDispose).toHaveBeenCalledTimes(1);
    expect(elementOf(first).isConnected).toBe(false);
    expect(liveHosts()).toEqual([elementOf(second)]);
  });

  it('disposing a replaced host leaves the current one alone', () => {
    const first = aHost();
    const second = aHost();
    first.dispose();
    expect(elementOf(second).isConnected).toBe(true);
    const onDispose = vi.fn();
    const third = aHost({ onDispose });
    third.dispose();
    const fourth = aHost();
    expect(onDispose).toHaveBeenCalledTimes(1);
    expect(liveHosts()).toEqual([elementOf(fourth)]);
  });

  it('an orphaned host (extension updated or removed) disposes itself', () => {
    vi.useFakeTimers();
    let alive = true;
    const onDispose = vi.fn();
    const host = aHost({ onDispose, isAlive: () => alive });
    vi.advanceTimersByTime(5000);
    expect(onDispose).not.toHaveBeenCalled();
    alive = false;
    vi.advanceTimersByTime(1000);
    expect(onDispose).toHaveBeenCalledTimes(1);
    expect(elementOf(host).isConnected).toBe(false);
  });

  it('an orphan notices at once when a newer extension instance adds its host', async () => {
    let alive = true;
    const onDispose = vi.fn();
    const host = aHost({ onDispose, isAlive: () => alive });
    alive = false;
    plantedRoot();
    await settle();
    expect(onDispose).toHaveBeenCalledTimes(1);
    expect(elementOf(host).isConnected).toBe(false);
  });
});
