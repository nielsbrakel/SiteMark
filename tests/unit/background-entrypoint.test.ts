import { describe, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { aSiteGroup, aState, aWildcardPattern } from '../../src/core/testing/builders';
import background from '../../src/entrypoints/background';
import { senders } from '../contracts/message-samples';
import { fakes } from '../fakes/install';

// The composition root (T-076, plan §3.1): the wiring, tested against the fake browser. The use
// cases behind it are tested with in-memory ports in src/app/background-app.test.ts. This file
// lives here because WXT would take src/entrypoints/background.test.ts for a second background.

const PROD = '*://prod.example.com/*';
const state = aState({
  siteGroups: [aSiteGroup({ patterns: [aWildcardPattern({ value: PROD })] })],
});

/** Delivers a message like the browser does and waits (up to 1 s) for the background's answer. */
function deliver(message: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    setTimeout(() => resolve('no answer'), 1000);
    void fakeBrowser.runtime.onMessage.trigger(message, senders.popup(), resolve);
  });
}

describe('REQ-PRIV-003 REQ-SEC-003 the background registers every listener synchronously', () => {
  it('has all its listeners before main() returns', () => {
    background.main();
    expect({
      messages: fakeBrowser.runtime.onMessage.hasListeners(),
      granted: fakes().permissions.api.onAdded.hasListeners(),
      revoked: fakes().permissions.api.onRemoved.hasListeners(),
      commands: fakes().commands.api.onCommand.hasListeners(),
      installed: fakeBrowser.runtime.onInstalled.hasListeners(),
      startup: fakeBrowser.runtime.onStartup.hasListeners(),
    }).toEqual({
      messages: true,
      granted: true,
      revoked: true,
      commands: true,
      installed: true,
      startup: true,
    });
  });

  it('syncs the marker registration from storage on every start (D-231)', async () => {
    await fakeBrowser.storage.local.set({ 'sitemark:state': state });
    fakes().permissions.grant(PROD);
    background.main();
    await vi.waitFor(() => {
      const registered = fakes().scripting.registered.map(({ id, matches }) => ({ id, matches }));
      expect(registered).toEqual([{ id: 'sitemark-marker', matches: [PROD] }]);
    });
  });

  it('answers extension pages through the wired handlers', async () => {
    await fakeBrowser.storage.local.set({ 'sitemark:state': state });
    background.main();
    expect(await deliver({ type: 'getState' })).toEqual({ ok: true, value: state });
  });

  it('opens the welcome tab on install (REQ-OPT-001)', async () => {
    const create = vi.spyOn(browser.tabs, 'create');
    background.main();
    await fakeBrowser.runtime.onInstalled.trigger({ reason: 'install' });
    await vi.waitFor(() => {
      const opened = create.mock.calls.map(([properties]) => properties.url);
      expect(opened).toEqual([`${fakeBrowser.runtime.getURL('/options.html')}#/welcome`]);
    });
  });
});
