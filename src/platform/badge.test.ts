import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import { createInMemoryLogger } from '../app/testing/in-memory-logger';
import { contrastRatio } from '../core/model/color';
import type { Hex } from '../core/model/schema';
import { badgeColors, createBadge } from './badge';

const rgba = (hex: string) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));

/** The light-theme `--sm-warning` token (the first definition in tokens.css). */
function warningToken(): string {
  const tokens = readFileSync('src/styles/tokens.css', 'utf8');
  return /--sm-warning:\s*(#[0-9a-f]{6})/i.exec(tokens)?.[1] ?? '';
}

describe('REQ-POP-007 the Badge adapter sets a text per tab', () => {
  it('shows the text on that tab only, in the warning color', async () => {
    await createBadge(createInMemoryLogger()).setText(7, '!');
    await expect(browser.action.getBadgeText({ tabId: 7 })).resolves.toBe('!');
    await expect(browser.action.getBadgeText({ tabId: 8 })).resolves.toBe('');
    const background = await browser.action.getBadgeBackgroundColor({ tabId: 7 });
    expect(background).toEqual([...rgba(badgeColors().background), 255]);
    await expect(browser.action.getBadgeTextColor({ tabId: 7 })).resolves.toBe(badgeColors().text);
  });

  it('clears the text', async () => {
    const badge = createBadge(createInMemoryLogger());
    await badge.setText(7, '!');
    await badge.setText(7, '');
    await expect(browser.action.getBadgeText({ tabId: 7 })).resolves.toBe('');
  });

  it('uses the warning token, with AA-contrast text on it (REQ-A11Y-001)', () => {
    const { background, text } = badgeColors();
    expect(background).toBe(warningToken());
    expect(contrastRatio(background as Hex, text as Hex)).toBeGreaterThanOrEqual(4.5);
  });

  it('logs a failure (e.g. a closed tab) instead of rejecting', async () => {
    const logger = createInMemoryLogger();
    const gone = new Error('No tab with id: 7.');
    vi.spyOn(browser.action, 'setBadgeText').mockRejectedValueOnce(gone);
    await expect(createBadge(logger).setText(7, '!')).resolves.toBeUndefined();
    expect(logger.entries).toEqual([
      { level: 'warn', message: 'Could not set the toolbar badge', detail: gone },
    ]);
  });
});
