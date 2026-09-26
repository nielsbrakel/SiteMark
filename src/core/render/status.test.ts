import { describe, expect, it } from 'vitest';
import type { MarkId } from '../ids';
import { pathsOf, times } from '../testing/schema-results';
import { parseTabStatus, type TabStatus } from './status';

const status: TabStatus = {
  marks: [
    { markId: 'mark00000001' as MarkId, found: true },
    { markId: 'mark00000002' as MarkId, found: false },
  ],
  favicon: 'unavailable',
  hidden: false,
};

describe('REQ-SEC-003 REQ-POP-002 a tab status from a content script is validated', () => {
  it('accepts a valid status', () => {
    expect(parseTabStatus(status)).toEqual({ ok: true, value: status });
    for (const favicon of ['available', 'unavailable', 'off'] as const) {
      expect(parseTabStatus({ ...status, favicon }).ok).toBe(true);
    }
  });

  it.each([
    ['favicon', { ...status, favicon: 'broken' }],
    ['hidden', { ...status, hidden: 'no' }],
    ['marks[0].markId', { ...status, marks: [{ markId: 'x', found: true }] }],
    ['marks[0].found', { ...status, marks: [{ markId: 'mark00000001' }] }],
    ['marks[0]', { ...status, marks: [{ markId: 'mark00000001', found: true, text: 'x' }] }],
    ['', { ...status, url: 'https://prod.example.com/' }],
    ['marks', { ...status, marks: 'all' }],
  ])('refuses an invalid %s', (path, input) => {
    const result = parseTabStatus(input);
    expect(result.ok).toBe(false);
    expect(pathsOf(result)).toContain(path);
  });

  it('refuses more marks than a state can hold', () => {
    const marks = times(10_001, () => status.marks[0]);
    expect(parseTabStatus({ ...status, marks }).ok).toBe(false);
  });

  it('refuses what is not a status', () => {
    for (const input of [undefined, null, 'ok', 1, []])
      expect(parseTabStatus(input).ok).toBe(false);
  });
});
