import { describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { validPayloads } from '../../tests/contracts/message-samples';
import { emptyPlan } from '../core/render/render-plan';
import { err, ok } from '../core/result';
import { sendToBackground } from './send-message';

/** A background that answers every message with `reply` and records what it got. */
function background(reply: unknown) {
  const received: unknown[] = [];
  fakeBrowser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    received.push(message);
    sendResponse(reply);
    return true;
  });
  return received;
}

describe('REQ-SEC-003 extension pages and content scripts send { type, data } to the background', () => {
  it('sends the message and returns the reply', async () => {
    const received = background(ok({ revision: 3, notices: [] }));
    const reply = await sendToBackground('command', validPayloads.command);
    expect(reply).toEqual(ok({ revision: 3, notices: [] }));
    expect(received).toEqual([{ type: 'command', data: validPayloads.command }]);
  });

  it('sends only the type when the message has no payload', async () => {
    const received = background(ok(emptyPlan()));
    await expect(sendToBackground('renderPlanFor')).resolves.toEqual(ok(emptyPlan()));
    expect(received).toEqual([{ type: 'renderPlanFor' }]);
  });

  it('passes a refusal through', async () => {
    background(err('messageRefused'));
    await expect(sendToBackground('requestGrant')).resolves.toEqual(err('messageRefused'));
  });

  it('reports noReceiver when nothing listens', async () => {
    await expect(sendToBackground('getState')).resolves.toEqual(err('noReceiver'));
  });

  it('reports noReceiver when sending throws synchronously', async () => {
    vi.spyOn(fakeBrowser.runtime, 'sendMessage').mockImplementationOnce(() => {
      throw new Error('Extension context invalidated.');
    });
    await expect(sendToBackground('getState')).resolves.toEqual(err('noReceiver'));
  });

  it.each([
    ['nothing', undefined],
    ['a bare value', 42],
    ['an object that is not a reply', { value: 1 }],
  ])('reports noReceiver for an answer that is %s', async (_name, reply) => {
    background(reply);
    await expect(sendToBackground('getState')).resolves.toEqual(err('noReceiver'));
  });
});
