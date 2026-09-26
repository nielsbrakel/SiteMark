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
