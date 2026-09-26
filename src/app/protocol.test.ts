import { describe, expect, it } from 'vitest';
import { emptyPlan } from '../core/render/render-plan';
import { tabMessage } from './protocol';

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
