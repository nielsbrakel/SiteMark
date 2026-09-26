import { describe, expect, it } from 'vitest';
import { validPayloads } from '../../tests/contracts/message-samples';
import type { BackgroundMessageType } from '../app/protocol';
import { backgroundMessageTypes, parsePayload } from './message-payloads';

const accepts = (type: BackgroundMessageType, data: unknown) => parsePayload(type, data).ok;

describe('REQ-SEC-003 every message payload is validated with a schema', () => {
  it('accepts a valid payload for every message', () => {
    for (const type of backgroundMessageTypes()) {
      expect(parsePayload(type, validPayloads[type]), type).toEqual({
        ok: true,
        value: validPayloads[type],
      });
    }
  });

  it('checks commands with the command schema', () => {
    expect(accepts('command', { type: 'setTheme', theme: 'dark' })).toBe(true);
    expect(accepts('command', { type: 'setTheme', theme: 'neon' })).toBe(false);
    expect(accepts('command', { type: 'exportEverything' })).toBe(false);
  });

  it.each(['getState', 'renderPlanFor', 'requestGrant'] as const)(
    'takes no payload for %s, so a content script can not name another URL (REQ-SEC-002)',
    (type) => {
      expect(accepts(type, undefined)).toBe(true);
      expect(accepts(type, { url: 'https://other.example/' })).toBe(false);
      expect(accepts(type, 'https://other.example/')).toBe(false);
    },
  );

  it.each([
    ['a negative tab', { tabId: -1 }],
    ['a fractional tab', { tabId: 1.5 }],
    ['a tab as text', { tabId: '7' }],
    ['no tab', {}],
    ['an extra key', { tabId: 7, url: 'https://x.test/' }],
  ])('refuses %s for tab messages', (_name, data) => {
    for (const type of ['toggleHidden', 'getTabStatus', 'startPicker'] as const) {
      expect(accepts(type, data), type).toBe(false);
    }
  });

  it('refuses an invalid mark ID to re-pick', () => {
    expect(accepts('startPicker', { tabId: 7 })).toBe(true);
    expect(accepts('startPicker', { tabId: 7, repickMarkId: 'x' })).toBe(false);
  });

  const pick = validPayloads.savePick;
  it.each([
    ['an empty selector', { ...pick, selector: '' }],
    ['a selector over 500 characters', { ...pick, selector: `#${'a'.repeat(500)}` }],
    ['an invalid site group ID', { ...pick, siteGroupId: '../x' }],
    ['no effects', { ...pick, effects: [] }],
    ['a page-only effect', { ...pick, effects: ['banner'] }],
    ['a repeated effect', { ...pick, effects: ['outline', 'outline'] }],
    ['a color that is not hex', { ...pick, color: 'red' }],
    ['an origin in the payload (taken from the sender)', { ...pick, origin: 'https://x.test' }],
  ])('refuses a savePick with %s', (_name, data) => {
    expect(accepts('savePick', data)).toBe(false);
  });

  it('accepts a savePick that re-picks a mark (REQ-PICK-007), with a valid mark ID only', () => {
    expect(accepts('savePick', { ...pick, repickMarkId: 'mark00000002' })).toBe(true);
    expect(accepts('savePick', { ...pick, repickMarkId: 'mark 2' })).toBe(false);
  });

  it('accepts a savePick for a new site group (no siteGroupId)', () => {
    const { siteGroupId: _, ...forNewGroup } = pick;
    expect(accepts('savePick', forNewGroup)).toBe(true);
  });

  it.each([
    ['text', { route: 'groups' }, true],
    ['an empty route', { route: '' }, true],
    ['a long route', { route: 'x'.repeat(501) }, false],
    ['no route', {}, false],
  ])('checks the openOptions route: %s', (_name, data, valid) => {
    expect(accepts('openOptions', data)).toBe(valid);
  });

  it.each([
    ['an unknown favicon state', { marks: [], favicon: 'maybe', hidden: false }],
    [
      'a mark without found',
      { marks: [{ markId: 'mark00000001' }], favicon: 'off', hidden: false },
    ],
    ['no hidden flag', { marks: [], favicon: 'off' }],
  ])('refuses a status report with %s', (_name, data) => {
    expect(accepts('reportStatus', data)).toBe(false);
  });
});

describe('REQ-POP-006 REQ-SEC-003 the markThisSite payload names a tab and its origin', () => {
  const request = validPayloads.markThisSite;
  it('accepts the default port as an empty string', () => {
    expect(accepts('markThisSite', { ...request, origin: { hostname: 'x.test', port: '' } })).toBe(
      true,
    );
  });

  it.each([
    ['no tab', { origin: request.origin }],
    ['no origin', { tabId: 7 }],
    ['an empty host', { tabId: 7, origin: { hostname: '', port: '' } }],
    ['a host over 253 characters', { tabId: 7, origin: { hostname: 'a'.repeat(254), port: '' } }],
    ['a port that is not a number', { tabId: 7, origin: { hostname: 'x.test', port: 'http' } }],
    ['a port over 5 digits', { tabId: 7, origin: { hostname: 'x.test', port: '123456' } }],
    ['a URL next to the origin', { ...request, url: 'https://x.test/' }],
    ['an extra origin key', { tabId: 7, origin: { ...request.origin, scheme: 'https' } }],
  ])('refuses %s', (_name, data) => {
    expect(accepts('markThisSite', data)).toBe(false);
  });
});

describe('REQ-DATA-005 REQ-SEC-003 the import payloads carry the file text and the mode', () => {
  it.each([
    ['merge', true],
    ['replace', true],
    ['append', false],
  ])('accepts the %s mode: %s', (mode, valid) => {
    expect(accepts('importApply', { text: '{}', mode })).toBe(valid);
  });

  it.each([
    ['no text', {}],
    ['text that is not a string', { text: 42 }],
    ['text over 2 MiB, far past the 1 MB file limit', { text: 'x'.repeat(2 * 1024 * 1024 + 1) }],
    ['an extra key', { text: '{}', origins: ['*://x.test/*'] }],
  ])('refuses a preview with %s', (_name, data) => {
    expect(accepts('importPreview', data)).toBe(false);
  });

  it('refuses an apply without a mode', () => {
    expect(accepts('importApply', { text: '{}' })).toBe(false);
  });
});
