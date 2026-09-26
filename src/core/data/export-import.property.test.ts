import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseState } from '../model/schema';
import { siteMarkState } from '../testing/arbitraries';
import { assertProperty } from '../testing/property';
import { buildExport } from './export';
import { parseImport } from './import';

// T-058: whatever valid state is exported imports back as the same site groups and settings.

const appVersion = fc.stringMatching(/^\d{1,4}(\.\d{1,4}){0,3}$/);
/** Any export time a clock can report, up to the last millisecond of year 9999. */
const now = fc.integer({ min: 0, max: Date.UTC(9999, 11, 31, 23, 59, 59, 999) });

describe('REQ-DATA-003 REQ-DATA-004 property: export → import identity', () => {
  it('generates states that parseState accepts unchanged', () => {
    assertProperty(
      fc.property(siteMarkState, (state) => {
        expect(parseState(state)).toEqual({ ok: true, value: state });
      }),
    );
  });

  it('imports an exported state as the same site groups and settings', () => {
    assertProperty(
      fc.property(siteMarkState, appVersion, now, (state, version, time) => {
        const { json } = buildExport(state, { appVersion: version, now: time });
        expect(parseImport(json)).toEqual({
          ok: true,
          value: { siteGroups: state.siteGroups, settings: state.settings },
        });
      }),
    );
  });
});
