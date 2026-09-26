import { describe, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import { fakes } from '../../tests/fakes/install';
import { ok } from '../core/result';
import type { OriginPattern } from '../core/url/origin';
import { importApplyClick } from './import-click';

const origins = ['*://a.example.com/*', 'https://b.example.org/*'] as OriginPattern[];
const file = { text: '{"schemaVersion":1}', mode: 'merge' } as const;

function background() {
  const promptsBefore: number[] = [];
  const send = vi.spyOn(browser.runtime, 'sendMessage').mockImplementation(async () => {
    promptsBefore.push(fakes().permissions.requests.length);
    return ok(ok({ revision: 5, notices: [] }));
  });
  return { send, promptsBefore };
}

describe('REQ-DATA-005 Apply requests every new origin in one prompt, then imports (D-229)', () => {
  it('prompts once for all new origins before sending, without awaiting the prompt', async () => {
    const { send, promptsBefore } = background();
    const click = importApplyClick(file, { originsToRequest: origins });
    expect(fakes().permissions.requests).toEqual([origins]);
    expect(send).toHaveBeenCalledExactlyOnceWith({ type: 'importApply', data: file });
    expect(promptsBefore).toEqual([1]);
    expect(await click.permission).toBe('granted');
    expect(await click.reply).toEqual(ok(ok({ revision: 5, notices: [] })));
  });

  it('imports without a prompt when no origin is new', async () => {
    const { send } = background();
    const click = importApplyClick(file, { originsToRequest: [] });
    expect(fakes().permissions.requests).toEqual([]);
    expect(send).toHaveBeenCalledOnce();
    expect(await click.permission).toBe('granted');
  });

  it('imports all the same when the user denies', async () => {
    const { send } = background();
    fakes().permissions.answerNextRequest('deny');
    const click = importApplyClick(file, { originsToRequest: origins });
    expect(await click.permission).toBe('denied');
    expect(send).toHaveBeenCalledOnce();
  });
});
