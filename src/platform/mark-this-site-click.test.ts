import { describe, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import { fakes } from '../../tests/fakes/install';
import { ok } from '../core/result';
import { markThisSiteClick } from './mark-this-site-click';

const committed = ok({ revision: 4, notices: [] });

/** A background that answers every message, recording how many prompts had started by then. */
function background() {
  const promptsBefore: number[] = [];
  const send = vi.spyOn(browser.runtime, 'sendMessage').mockImplementation(async () => {
    promptsBefore.push(fakes().permissions.requests.length);
    return ok(committed);
  });
  return { send, promptsBefore };
}

describe('REQ-POP-006 the popup prompts first and synchronously, then sends the command (D-229)', () => {
  it('requests the host origin before sending, without awaiting the prompt', async () => {
    const { send, promptsBefore } = background();
    const click = markThisSiteClick({ id: 7, url: 'https://staging.example.com:8080/a?b=1' });
    expect(fakes().permissions.requests).toEqual([['*://staging.example.com/*']]);
    expect(send).toHaveBeenCalledExactlyOnceWith({
      type: 'markThisSite',
      data: { tabId: 7, origin: { hostname: 'staging.example.com', port: '8080' } },
    });
    expect(promptsBefore).toEqual([1]);
    await expect(click?.reply).resolves.toEqual(ok(committed));
    await expect(click?.permission).resolves.toBe('granted');
  });

  it('adds the group even when the user denies (the "Not granted — Allow" state)', async () => {
    const { send } = background();
    fakes().permissions.answerNextRequest('deny');
    const click = markThisSiteClick({ id: 3, url: 'http://intranet/' });
    await expect(click?.permission).resolves.toBe('denied');
    expect(send).toHaveBeenCalledExactlyOnceWith({
      type: 'markThisSite',
      data: { tabId: 3, origin: { hostname: 'intranet', port: '' } },
    });
  });

  it.each(['chrome://extensions/', 'file:///home/me/a.html', 'not a url'])(
    'does nothing on %s',
    (url) => {
      const { send } = background();
      expect(markThisSiteClick({ id: 7, url })).toBeUndefined();
      expect(fakes().permissions.requests).toEqual([]);
      expect(send).not.toHaveBeenCalled();
    },
  );
});
