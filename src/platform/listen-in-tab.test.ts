import { describe, expect, it, vi } from 'vitest';
import type { Browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { sender, senders, status } from '../../tests/contracts/message-samples';
import type { TabHandlers } from '../app/protocol';
import { emptyPlan } from '../core/render/render-plan';
import { listenForBackground } from './listen-in-tab';

function listen() {
  const spies = {
    applyPlan: vi.fn(),
    setHidden: vi.fn(),
    getStatus: vi.fn(() => status),
  } satisfies TabHandlers;
  const unsubscribe = listenForBackground(spies);
  return { spies, unsubscribe };
}

/** Delivers a message; returns what the listener returned and what it answered right away. */
async function deliver(message: unknown, from: Browser.runtime.MessageSender) {
  const answers: unknown[] = [];
  const [returned] = await fakeBrowser.runtime.onMessage.trigger(message, from, (answer) =>
    answers.push(answer),
  );
  return { returned, answers };
}

describe('REQ-SEC-003 REQ-SEC-002 a content script only takes messages from the background', () => {
  it('applies a plan pushed by the background and answers at once', async () => {
    const { spies } = listen();
    const plan = emptyPlan();
    const { returned, answers } = await deliver(
      { type: 'applyPlan', data: plan },
      senders.background(),
    );
    expect(spies.applyPlan).toHaveBeenCalledExactlyOnceWith(plan);
    expect(returned).not.toBe(true);
    expect(answers).toEqual([]);
  });

  it('sets the hidden state', async () => {
    const { spies } = listen();
    await deliver({ type: 'setHidden', data: { hidden: true } }, senders.background());
    expect(spies.setHidden).toHaveBeenCalledExactlyOnceWith({ hidden: true });
  });

  it('answers getStatus synchronously', async () => {
    listen();
    const { returned, answers } = await deliver({ type: 'getStatus' }, senders.background());
    expect(answers).toEqual([status]);
    expect(returned).not.toBe(true);
  });

  it('accepts messages from an extension page too, like the popup', async () => {
    const { spies } = listen();
    await deliver({ type: 'setHidden', data: { hidden: false } }, senders.popup());
    expect(spies.setHidden).toHaveBeenCalledOnce();
  });

  it.each([
    ['another extension', sender({ id: 'other', url: 'chrome-extension://other/background.js' })],
    ['no extension id', sender({ url: 'chrome-extension://test-extension-id/background.js' })],
    ['a web page URL', sender({ id: 'test-extension-id', url: 'https://evil.example/' })],
    ['a tab (a content script elsewhere)', senders.content()],
    ['an extension page in a tab', senders.optionsTab()],
  ])('ignores a message from %s', async (_name, from) => {
    const { spies } = listen();
    const { answers } = await deliver({ type: 'getStatus' }, from);
    await deliver({ type: 'applyPlan', data: emptyPlan() }, from);
    expect(answers).toEqual([]);
    expect(spies.getStatus).not.toHaveBeenCalled();
    expect(spies.applyPlan).not.toHaveBeenCalled();
  });

  it.each([
    ['nothing', undefined],
    ['an unknown type', { type: 'readState' }],
    ['an inherited property', { type: 'constructor' }],
  ])('ignores %s', async (_name, message) => {
    const { spies } = listen();
    const { answers } = await deliver(message, senders.background());
    expect(answers).toEqual([]);
    for (const spy of Object.values(spies)) expect(spy).not.toHaveBeenCalled();
  });

  it('removes its listener again', () => {
    const { unsubscribe } = listen();
    expect(fakeBrowser.runtime.onMessage.hasListeners()).toBe(true);
    unsubscribe();
    expect(fakeBrowser.runtime.onMessage.hasListeners()).toBe(false);
  });
});
