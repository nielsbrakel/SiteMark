import { fireEvent, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { openPanel } from './open-panel';
import type { PickerSession } from './picker';

// The panel wired to the background (REQ-PICK-005, REQ-PICK-006). happy-dom has no isTrusted, so
// events are made trusted here; the clock is faked past the panel's 500 ms activation delay.

type Message = { type: string; data?: unknown };

const sent: Message[] = [];
let isGranted = true;

function reply(message: Message): unknown {
  switch (message.type) {
    case 'pickerContext':
      return { ok: true, value: { groups: [], theme: 'system', isGranted } };
    case 'savePick':
      return { ok: true, value: { ok: true, value: { markId: 'm', siteGroupId: 'g' } } };
    default:
      return { ok: true, value: undefined };
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(Event.prototype, 'isTrusted', { get: () => true, configurable: true });
  vi.spyOn(fakeBrowser.runtime, 'sendMessage').mockImplementation(async (message: unknown) => {
    sent.push(message as Message);
    return reply(message as Message);
  });
});

afterEach(() => {
  Reflect.deleteProperty(Event.prototype, 'isTrusted');
  vi.useRealTimers();
  sent.length = 0;
  isGranted = true;
  document.body.replaceChildren();
});

async function aPick() {
  const target = document.createElement('button');
  target.id = 'target';
  const root = document.createElement('div');
  document.body.append(target, root);
  const session = {
    dispatch: vi.fn(),
    state: () => ({ kind: 'editing', selection: target }),
  } as unknown as PickerSession & { dispatch: ReturnType<typeof vi.fn> };
  await openPanel(target, session, root);
  vi.advanceTimersByTime(600);
  return { session, ui: within(root) };
}

async function click(element: HTMLElement): Promise<void> {
  fireEvent.click(element);
  await vi.advanceTimersByTimeAsync(600);
}

const types = () => sent.map((message) => message.type);

describe('REQ-PICK-006 saving on a site that is not granted', () => {
  it('ends the pick at once on a granted site', async () => {
    const { session, ui } = await aPick();
    await click(ui.getByRole('button', { name: 'Save' }));
    expect(types()).toEqual(['pickerContext', 'savePick']);
    expect(session.dispatch).toHaveBeenCalledWith({ type: 'save' });
  });

  it('keeps the panel open with the notice until Allow, which asks for the grant page', async () => {
    isGranted = false;
    const { session, ui } = await aPick();
    await click(ui.getByRole('button', { name: 'Save' }));
    expect(session.dispatch).not.toHaveBeenCalled();
    const allow = ui.queryByRole('button', { name: 'Allow' });
    expect(allow).not.toBeNull();
    await click(allow as HTMLElement);
    expect(types()).toEqual(['pickerContext', 'savePick', 'requestGrant']);
    expect(session.dispatch).toHaveBeenCalledWith({ type: 'save' });
  });

  it('ends the pick without a grant request on Close', async () => {
    isGranted = false;
    const { session, ui } = await aPick();
    await click(ui.getByRole('button', { name: 'Save' }));
    const close = ui.queryByRole('button', { name: 'Close' });
    expect(close).not.toBeNull();
    await click(close as HTMLElement);
    expect(types()).not.toContain('requestGrant');
    expect(session.dispatch).toHaveBeenCalledWith({ type: 'save' });
  });
});
