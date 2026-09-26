import { describe, expect, it, vi } from 'vitest';
import type { Browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import {
  contentTypes,
  pageTypes,
  sender,
  senders,
  status,
  validPayloads,
} from '../../tests/contracts/message-samples';
import type { BackgroundHandlers } from '../app/protocol';
import { createInMemoryLogger } from '../app/testing/in-memory-logger';
import type { MarkId } from '../core/ids';
import { emptyState } from '../core/model/defaults';
import { emptyPlan } from '../core/render/render-plan';
import { err, ok } from '../core/result';
import { backgroundMessageTypes } from './message-payloads';
import { listenForMessages } from './messaging';

const responses = {
  command: ok({ revision: 1, notices: [] }),
  getState: emptyState(),
  startPicker: undefined,
  toggleHidden: undefined,
  getTabStatus: status,
  renderPlanFor: emptyPlan(),
  reportStatus: undefined,
  savePick: ok('mark00000009' as MarkId),
  requestGrant: undefined,
  openOptions: undefined,
};

function handlers() {
  return {
    command: vi.fn(async () => responses.command),
    getState: vi.fn(() => responses.getState),
    startPicker: vi.fn(),
    toggleHidden: vi.fn(),
    getTabStatus: vi.fn(async () => responses.getTabStatus),
    renderPlanFor: vi.fn(() => responses.renderPlanFor),
    reportStatus: vi.fn(),
    savePick: vi.fn(() => responses.savePick),
    requestGrant: vi.fn(),
    openOptions: vi.fn(),
  } satisfies BackgroundHandlers;
}

function listen() {
  const spies = handlers();
  const logger = createInMemoryLogger();
  const unsubscribe = listenForMessages(spies, logger);
  return { spies, logger, unsubscribe };
}

/** Delivers a message like the browser does and waits for the background's answer. */
function deliver(message: unknown, from: Browser.runtime.MessageSender): Promise<unknown> {
  return new Promise((resolve) => {
    void fakeBrowser.runtime.onMessage.trigger(message, from, resolve);
  });
}

const refused = err('messageRefused');

describe('REQ-SEC-003 the background answers every protocol message with its handler', () => {
  it('has a handler and a payload schema for every protocol message (contract)', () => {
    expect([...backgroundMessageTypes()].sort()).toEqual(Object.keys(handlers()).sort());
    expect([...backgroundMessageTypes()].sort()).toEqual([...pageTypes, ...contentTypes].sort());
  });

  it.each(pageTypes)('routes %s from an extension page to its handler', async (type) => {
    const { spies } = listen();
    const reply = await deliver({ type, data: validPayloads[type] }, senders.popup());
    expect(reply).toEqual(ok(responses[type]));
    expect(spies[type]).toHaveBeenCalledExactlyOnceWith(validPayloads[type]);
  });

  it('accepts extension pages that run in a tab, like the options page', async () => {
    const { spies } = listen();
    const reply = await deliver({ type: 'getState' }, senders.optionsTab());
    expect(reply).toEqual(ok(responses.getState));
    expect(spies.getState).toHaveBeenCalledOnce();
  });

  it.each(contentTypes)(
    'routes %s from a top-frame content script with its sender',
    async (type) => {
      const { spies } = listen();
      const reply = await deliver({ type, data: validPayloads[type] }, senders.content());
      expect(reply).toEqual(ok(responses[type]));
      expect(spies[type]).toHaveBeenCalledExactlyOnceWith(validPayloads[type], {
        tabId: 7,
        url: 'https://prod.example.com:8443/app?x=1#top',
        origin: 'https://prod.example.com:8443',
      });
    },
  );

  it('registers one runtime.onMessage listener and removes it again', () => {
    const { unsubscribe } = listen();
    expect(fakeBrowser.runtime.onMessage.hasListeners()).toBe(true);
    unsubscribe();
    expect(fakeBrowser.runtime.onMessage.hasListeners()).toBe(false);
  });
});

describe('REQ-SEC-003 the background refuses messages from the wrong sender', () => {
  const other = { id: 'another-extension' };
  it.each([
    ['another extension', sender({ ...other, url: 'chrome-extension://another-extension/p.html' })],
    ['no extension id', sender({ url: 'chrome-extension://test-extension-id/popup.html' })],
    ['a web page', sender({ id: 'test-extension-id', url: 'https://evil.example/' })],
    ['a content script', senders.content()],
    ['no URL', sender({ id: 'test-extension-id' })],
  ])('refuses a page message from %s', async (_name, from) => {
    const { spies } = listen();
    await expect(deliver({ type: 'command', data: validPayloads.command }, from)).resolves.toEqual(
      refused,
    );
    expect(spies.command).not.toHaveBeenCalled();
  });

  const content = (fields: object) => sender({ ...senders.content(), ...fields });
  it.each([
    ['another extension', content(other)],
    ['a subframe', content({ frameId: 2 })],
    ['no frame', content({ frameId: undefined })],
    ['no tab', content({ tab: undefined })],
    ['a tab without an id', content({ tab: {} })],
    ['no URL', content({ url: undefined })],
    ['a URL that does not parse', content({ url: 'not a url' })],
    ['a page that is not http(s)', content({ url: 'file:///home/me/page.html' })],
    ['an extension page', senders.optionsTab()],
    ['the popup', senders.popup()],
  ])('refuses a content message from %s', async (_name, from) => {
    const { spies } = listen();
    await expect(
      deliver({ type: 'savePick', data: validPayloads.savePick }, from),
    ).resolves.toEqual(refused);
    expect(spies.savePick).not.toHaveBeenCalled();
  });
});

describe('REQ-SEC-003 the background refuses malformed messages', () => {
  it.each([
    ['nothing', undefined],
    ['a string', 'command'],
    ['no type', { data: {} }],
    ['an unknown type', { type: 'deleteEverything' }],
    ['an inherited property', { type: 'toString' }],
    ['a prototype key', { type: '__proto__' }],
    ['a numeric type', { type: 7 }],
    ['an invalid command', { type: 'command', data: { type: 'wipeStorage' } }],
    ['an invalid payload', { type: 'getTabStatus', data: { tabId: -1 } }],
    ['a payload where none belongs', { type: 'renderPlanFor', data: { url: 'https://x.test/' } }],
  ])('refuses %s', async (_name, message) => {
    const { spies } = listen();
    await expect(deliver(message, senders.content())).resolves.toEqual(refused);
    await expect(deliver(message, senders.popup())).resolves.toEqual(refused);
    for (const spy of Object.values(spies)) expect(spy).not.toHaveBeenCalled();
  });

  it('answers handlerFailed when a handler throws, and logs the error', async () => {
    const { spies, logger } = listen();
    const failure = new Error('storage gone');
    spies.getState.mockImplementationOnce(() => {
      throw failure;
    });
    spies.command.mockRejectedValueOnce(failure);
    await expect(deliver({ type: 'getState' }, senders.popup())).resolves.toEqual(
      err('handlerFailed'),
    );
    await expect(
      deliver({ type: 'command', data: validPayloads.command }, senders.popup()),
    ).resolves.toEqual(err('handlerFailed'));
    expect(logger.entries.map(({ level, detail }) => [level, detail])).toEqual([
      ['error', failure],
      ['error', failure],
    ]);
  });
});
