import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import newer from '../../../tests/fixtures/state/newer.json';
import type { SiteMarkState } from '../../core/model/schema';
import { err, ok, type Result } from '../../core/result';
import { aState } from '../../core/testing/builders';
import { type StateSource, useSiteMarkState } from './use-site-mark-state';

const KEY = 'sitemark:state';

/** A background that answers `getState` with `reply` and records the messages it got. */
function background(reply: unknown) {
  const received: unknown[] = [];
  fakeBrowser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    received.push(message);
    sendResponse(reply);
    return true;
  });
  return received;
}

/** What the background would write (the page itself never writes). */
const store = (value: unknown) => act(() => fakeBrowser.storage.local.set({ [KEY]: value }));

async function settled(source?: StateSource) {
  const view = renderHook(() => useSiteMarkState(source));
  expect(view.result.current).toEqual({ status: 'loading' });
  await waitFor(() => expect(view.result.current.status).not.toBe('loading'));
  return view;
}

describe('REQ-SEC-001 REQ-DATA-007 useSiteMarkState: a read-only view of the state, pushed live', () => {
  it("shows the background's state from getState and writes nothing", async () => {
    const state = aState({ revision: 3 });
    await fakeBrowser.storage.local.set({ [KEY]: state });
    const received = background(ok(state));
    const set = vi.spyOn(fakeBrowser.storage.local, 'set');
    const { result } = await settled();
    expect(result.current).toEqual({ status: 'ready', state });
    expect(received).toEqual([{ type: 'getState' }]);
    expect(set).not.toHaveBeenCalled();
  });

  it('shows the defaults the background answers with before anything is stored', async () => {
    const state = aState({ siteGroups: [] });
    background(ok(state));
    const { result } = await settled();
    expect(result.current).toEqual({ status: 'ready', state });
  });

  it('follows each state the background stores', async () => {
    background(ok(aState({ revision: 3 })));
    const { result } = await settled();
    const next = aState({ revision: 4, settings: { theme: 'dark' } });
    await store(next);
    expect(result.current).toEqual({ status: 'ready', state: next });
  });

  it('keeps the newest revision when an older answer arrives late', async () => {
    const newest = aState({ revision: 5 });
    const answers: ((reply: Result<SiteMarkState, never>) => void)[] = [];
    const pushes: ((raw: unknown) => void)[] = [];
    const source: StateSource = {
      getState: () => new Promise((resolve) => answers.push(resolve)),
      readStored: async () => undefined,
      watch: (listener) => {
        pushes.push(listener);
        return () => undefined;
      },
    };
    const { result } = renderHook(() => useSiteMarkState(source));
    await waitFor(() => expect(answers).toHaveLength(1));
    act(() => pushes.at(-1)?.(newest));
    await act(async () => answers[0]?.(ok(aState({ revision: 4 }))));
    expect(result.current).toEqual({ status: 'ready', state: newest });
  });

  it('is read-only when the stored data comes from a newer SiteMark', async () => {
    await fakeBrowser.storage.local.set({ [KEY]: newer });
    background(ok(aState()));
    const { result } = await settled();
    expect(result.current).toEqual({ status: 'readOnly', schemaVersion: 2 });
  });

  it('turns read-only when a newer SiteMark stores its data', async () => {
    background(ok(aState()));
    const { result } = await settled();
    await store(newer);
    expect(result.current).toEqual({ status: 'readOnly', schemaVersion: 2 });
  });

  it('reports an unreadable stored state', async () => {
    background(ok(aState()));
    const { result } = await settled();
    await store({ schemaVersion: 1, revision: 'x' });
    expect(result.current).toEqual({ status: 'error', error: 'stateUnreadable' });
  });

  it('ignores a removed key', async () => {
    const state = aState();
    background(ok(state));
    const { result } = await settled();
    await act(() => fakeBrowser.storage.local.remove(KEY));
    expect(result.current).toEqual({ status: 'ready', state });
  });

  it('ignores changes to other keys', async () => {
    const state = aState();
    background(ok(state));
    const { result } = await settled();
    await act(() => fakeBrowser.storage.local.set({ 'sitemark:backup:0': { raw: 1 } }));
    expect(result.current).toEqual({ status: 'ready', state });
  });

  it('reports noReceiver when the background does not answer', async () => {
    const { result } = await settled();
    expect(result.current).toEqual({ status: 'error', error: 'noReceiver' });
  });

  it('passes a refusal through', async () => {
    background(err('messageRefused'));
    const { result } = await settled();
    expect(result.current).toEqual({ status: 'error', error: 'messageRefused' });
  });

  it('re-validates the reply and rejects one that is not a state', async () => {
    background(ok({ schemaVersion: 1, siteGroups: 'nope' }));
    const { result } = await settled();
    expect(result.current).toEqual({ status: 'error', error: 'stateInvalid' });
  });

  it('stops watching when the page unmounts', async () => {
    const unsubscribe = vi.fn();
    const source: StateSource = {
      getState: async () => ok(aState()),
      readStored: async () => undefined,
      watch: () => unsubscribe,
    };
    const { unmount } = await settled(source);
    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
