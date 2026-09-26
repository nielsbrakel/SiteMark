import { expect } from 'vitest';
import type { SiteGroupId } from '../ids';
import { parseState, type SiteGroup, type SiteMarkState } from '../model/schema';
import type { Result } from '../result';
import { aState } from './builders';

// Helpers for reducer tests (src/core/commands). Reducers get deeply frozen states, so a reducer
// that mutates its input throws (modules run in strict mode).

/** An ID that no builder or fixedIdGen() produces. */
export const MISSING_GROUP_ID = 'grp-missing0' as SiteGroupId;

/** Freezes `value` and everything reachable from it, and returns it. */
export function frozen<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) frozen(child);
    Object.freeze(value);
  }
  return value;
}

/** A frozen state at revision 7 with exactly these site groups. */
export function stateWith(...siteGroups: SiteGroup[]): SiteMarkState {
  return frozen(aState({ revision: 7, siteGroups }));
}

/** The new state, checked against the schema; fails the test when the reducer refused. */
export function applied(result: Result<SiteMarkState, unknown>): SiteMarkState {
  if (!result.ok) expect.fail(`expected ok, got ${String(result.error)}`);
  expect(parseState(result.value)).toEqual({ ok: true, value: result.value });
  return result.value;
}
