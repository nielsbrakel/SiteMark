import { afterEach, describe, expect, it, vi } from 'vitest';
import { aHost, cleanUp, elementOf, settle } from '../../../tests/browser/host-harness';

afterEach(() => {
  cleanUp();
  vi.useRealTimers();
});

async function removeAndSettle(element: HTMLElement): Promise<boolean> {
  element.remove();
  await settle();
  return element.isConnected;
}

describe('REQ-SEC-006 the host comes back when the page removes it', () => {
  it('re-attaches the same element to <html> and restores the top layer', async () => {
    const host = aHost();
    const element = elementOf(host);
    host.show();
    expect(await removeAndSettle(element)).toBe(true);
    expect(element.parentNode).toBe(document.documentElement);
    expect(element.matches(':popover-open')).toBe(true);
  });

  it('comes back when the page swaps it for its own <sitemark-root>', async () => {
    const host = aHost();
    const element = elementOf(host);
    const impostor = document.createElement('sitemark-root');
    element.replaceWith(impostor);
    await settle();
    expect(element.parentNode).toBe(document.documentElement);
    expect(impostor.isConnected).toBe(true);
    expect(impostor.shadowRoot).toBeNull();
    impostor.remove();
  });

  it('re-attaches at most 10 times per 10 s, then once more when the window frees up', async () => {
    vi.useFakeTimers();
    const element = elementOf(aHost());
    const results: boolean[] = [];
    for (let i = 0; i < 11; i += 1) results.push(await removeAndSettle(element));
    expect(results).toEqual([...Array(10).fill(true), false]);
    vi.advanceTimersByTime(10_000);
    expect(element.isConnected).toBe(true);
    expect(await removeAndSettle(element)).toBe(true);
  });

  it('stays gone after dispose()', async () => {
    const host = aHost();
    const element = elementOf(host);
    host.dispose();
    document.documentElement.append(element);
    expect(await removeAndSettle(element)).toBe(false);
  });
});
