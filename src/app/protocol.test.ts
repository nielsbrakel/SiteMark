import { describe, expect, it } from 'vitest';
import type { MarkId } from '../core/ids';
import { emptyPlan } from '../core/render/render-plan';
import { pickerMessage, tabMessage } from './protocol';

describe('REQ-SEC-002 messages to a tab carry only their own data', () => {
  it('builds { type, data }', () => {
    const plan = emptyPlan();
    expect(tabMessage('applyPlan', plan)).toEqual({ type: 'applyPlan', data: plan });
    expect(tabMessage('setHidden', { hidden: true })).toEqual({
      type: 'setHidden',
      data: { hidden: true },
    });
  });

  it('leaves the data out when there is none', () => {
    expect(tabMessage('getStatus', undefined)).toStrictEqual({ type: 'getStatus' });
  });
});

describe('REQ-PICK-007 the background tells a started picker which mark it re-picks', () => {
  it('builds { type, data }', () => {
    const markId = 'mark00000001' as MarkId;
    expect(pickerMessage('repick', { markId })).toEqual({ type: 'repick', data: { markId } });
  });
});
