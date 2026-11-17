import { existsSync, readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import type { BadgeState } from '../app/ports';
import { createInMemoryLogger } from '../app/testing/in-memory-logger';
import { badgeIconPaths, createBadge } from './badge';

const STATES: readonly BadgeState[] = ['none', 'active', 'hidden', 'attention', 'restricted'];
const setIcon = vi.fn();

beforeEach(() => {
  // The fake browser has no `action.setIcon`.
  setIcon.mockReset().mockResolvedValue(undefined);
  Object.assign(browser.action, { setIcon });
});

/** The width and height in the PNG header of a file in `public/`, or undefined when it is missing. */
function pngSize(path: string): [number, number] | undefined {
  const file = `public/${path}`;
  if (!existsSync(file)) return undefined;
  const header = readFileSync(file);
  return [header.readUInt32BE(16), header.readUInt32BE(20)];
}

describe('REQ-POP-010 the Badge adapter sets the icon of one tab', () => {
  it('uses the plain icons for "none" and the sticker icons for the other states', () => {
    expect(badgeIconPaths('none')).toEqual({
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
    });
    expect(badgeIconPaths('attention')).toEqual({
      16: 'icon/attention-16.png',
      32: 'icon/attention-32.png',
      48: 'icon/attention-48.png',
    });
  });

  it.each(STATES)('has every icon file of "%s" at its own size', (state) => {
    for (const [size, path] of Object.entries(badgeIconPaths(state))) {
      expect(pngSize(path), path).toEqual([Number(size), Number(size)]);
    }
  });

  it('sets the icon on that tab only', async () => {
    await createBadge(createInMemoryLogger()).setState(7, 'active');
    expect(setIcon).toHaveBeenCalledExactlyOnceWith({ tabId: 7, path: badgeIconPaths('active') });
  });

  it('logs a failure (e.g. a closed tab) instead of rejecting', async () => {
    const logger = createInMemoryLogger();
    const gone = new Error('No tab with id: 7.');
    setIcon.mockRejectedValueOnce(gone);
    await expect(createBadge(logger).setState(7, 'hidden')).resolves.toBeUndefined();
    expect(logger.entries).toEqual([
      { level: 'warn', message: 'Could not set the toolbar icon', detail: gone },
    ]);
  });
});
