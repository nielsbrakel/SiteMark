import { describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { listenForTabChanges } from './tab-changes';

describe('REQ-POP-010 the toolbar icon follows a tab to another site', () => {
  it('calls back when a tab gets a new URL, and only then', async () => {
    const onChange = vi.fn();
    listenForTabChanges(onChange);
    await fakeBrowser.tabs.onUpdated.trigger(1, { status: 'loading' }, { id: 1 } as never);
    expect(onChange).not.toHaveBeenCalled();
    await fakeBrowser.tabs.onUpdated.trigger(1, { url: 'https://prod.example.com/' }, {
      id: 1,
    } as never);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('stops listening when unsubscribed', () => {
    const stop = listenForTabChanges(vi.fn());
    expect(fakeBrowser.tabs.onUpdated.hasListeners()).toBe(true);
    stop();
    expect(fakeBrowser.tabs.onUpdated.hasListeners()).toBe(false);
  });
});
