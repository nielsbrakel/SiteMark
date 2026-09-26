import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import type { Command } from '../../core/commands/command';
import { err, ok } from '../../core/result';
import { sendCommand, useCommand } from './use-command';

const createGroup = { type: 'createSiteGroup', name: 'Staging' } as Command;

/** A background that answers each command with the next reply; `hold` delays the answers. */
function background(...replies: unknown[]) {
  const received: unknown[] = [];
  const held: (() => void)[] = [];
  let isHolding = false;
  fakeBrowser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    received.push(message);
    const reply = replies.shift();
    if (isHolding) held.push(() => sendResponse(reply));
    else sendResponse(reply);
    return true;
  });
  return {
    received,
    hold: () => {
      isHolding = true;
    },
    held,
    release: () => {
      for (const answer of held.splice(0)) answer();
    },
  };
}

describe('REQ-SEC-001 pages change the state only by sending commands to the background', () => {
  it('sends the command and returns what the background committed', async () => {
    const bg = background(ok(ok({ revision: 8, notices: [] })));
    await expect(sendCommand(createGroup)).resolves.toEqual(ok({ revision: 8, notices: [] }));
    expect(bg.received).toEqual([{ type: 'command', data: createGroup }]);
  });

  it('surfaces the core error of a refused command', async () => {
    background(ok(err('siteGroupNotFound')));
    await expect(sendCommand(createGroup)).resolves.toEqual(err('siteGroupNotFound'));
  });

  it('surfaces messaging failures', async () => {
    background(err('messageRefused'));
    await expect(sendCommand(createGroup)).resolves.toEqual(err('messageRefused'));
    fakeBrowser.runtime.onMessage.removeAllListeners();
    await expect(sendCommand(createGroup)).resolves.toEqual(err('noReceiver'));
  });
});

describe('REQ-SEC-001 useCommand tracks pending commands and the last error', () => {
  it('is pending until the background answers', async () => {
    const bg = background(ok(ok({ revision: 1, notices: [] })));
    bg.hold();
    const { result } = renderHook(() => useCommand());
    expect(result.current).toMatchObject({ isPending: false, error: undefined });
    let reply: Promise<unknown> = Promise.resolve();
    act(() => {
      reply = result.current.send(createGroup);
    });
    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(bg.held).toHaveLength(1));
    await act(async () => {
      bg.release();
      await reply;
    });
    expect(result.current).toMatchObject({ isPending: false, error: undefined });
  });

  it('keeps the error of a failed command until the next success', async () => {
    background(ok(err('siteGroupNeedsPattern')), ok(ok({ revision: 2, notices: [] })));
    const { result } = renderHook(() => useCommand());
    await act(async () => {
      await expect(result.current.send(createGroup)).resolves.toEqual(err('siteGroupNeedsPattern'));
    });
    expect(result.current.error).toBe('siteGroupNeedsPattern');
    await act(async () => {
      await result.current.send(createGroup);
    });
    expect(result.current.error).toBeUndefined();
  });
});
