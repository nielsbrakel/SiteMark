import { describe, expect, it } from 'vitest';
import corruptFixture from '../../../tests/fixtures/state/corrupt.json';
import newerFixture from '../../../tests/fixtures/state/newer.json';
import v1Fixture from '../../../tests/fixtures/state/v1.json';
import type { SchemaIssue } from '../model/schema';
import type { Result } from '../result';
import { aSiteGroup, aState } from '../testing/builders';
import { untrusted } from '../testing/schema-results';
import { type MigrateError, type MigrationSteps, migrate, runSteps } from './migrate';

/** The error of a failed migration; fails the test when it succeeded. */
function errorOf<T>(result: Result<T, MigrateError>): MigrateError {
  if (result.ok) expect.fail(`expected an error, got ${JSON.stringify(result.value)}`);
  return result.error;
}

/** The issues of an unreadable-state error; fails the test for any other outcome. */
function issuesOf<T>(result: Result<T, MigrateError>): readonly SchemaIssue[] {
  const error = errorOf(result);
  if (error.code !== 'stateUnreadable') expect.fail(`expected stateUnreadable, got ${error.code}`);
  return error.issues;
}

const pathsIn = <T>(result: Result<T, MigrateError>): string[] =>
  issuesOf(result).map((issue) => issue.path);

/** A pretend pre-release format: `groups` instead of `siteGroups`, no settings. */
const legacyV0 = { schemaVersion: 0, revision: 3, groups: [] };
const v0ToV1 = (data: unknown): unknown => {
  const { groups, revision } = data as { groups: unknown[]; revision: number };
  return { schemaVersion: 1, revision, siteGroups: groups, settings: { theme: 'system' } };
};

describe('REQ-DATA-002 migrate(): one pipeline for stored state and imports', () => {
  it('reads the v1 fixture as it is (tests/fixtures/state/v1.json)', () => {
    expect(migrate(untrusted(v1Fixture))).toEqual({
      ok: true,
      value: { state: v1Fixture, fromVersion: 1 },
    });
  });

  it('accepts any valid current state', () => {
    const state = aState({ revision: 9, siteGroups: [aSiteGroup(), aSiteGroup()] });
    expect(migrate(untrusted(state))).toEqual({ ok: true, value: { state, fromVersion: 1 } });
  });

  it('runs the steps from the detected version up to the current one, then validates', () => {
    const result = migrate(untrusted(legacyV0), { 0: v0ToV1 });
    expect(result).toEqual({
      ok: true,
      value: {
        state: { schemaVersion: 1, revision: 3, siteGroups: [], settings: { theme: 'system' } },
        fromVersion: 0,
      },
    });
  });

  it('reports a migrated result that is still invalid as unreadable', () => {
    const broken = { ...legacyV0, groups: [{ name: 'no id' }] };
    expect(pathsIn(migrate(untrusted(broken), { 0: v0ToV1 }))).toContain('siteGroups[0].id');
  });

  it('has no step for versions older than 1 yet, so they are unreadable', () => {
    expect(pathsIn(migrate(untrusted(legacyV0)))).toEqual(['schemaVersion']);
  });

  it('does not change the data it was given', () => {
    const raw = untrusted(legacyV0);
    migrate(raw, { 0: v0ToV1 });
    expect(raw).toEqual(legacyV0);
  });
});

describe('REQ-DATA-002 the step runner', () => {
  const tag =
    (version: number): ((data: unknown) => unknown) =>
    (data) => [...(data as number[]), version];

  it('applies each step once, in version order', () => {
    const steps: MigrationSteps = { 1: tag(1), 2: tag(2), 3: tag(3) };
    expect(runSteps([], 1, 4, steps)).toEqual({ ok: true, value: [1, 2, 3] });
  });

  it('returns the data unchanged when it is already at the target version', () => {
    const data = { schemaVersion: 3 };
    const result = runSteps(data, 3, 3, { 3: tag(3) });
    expect(result).toEqual({ ok: true, value: data });
  });

  it('reports a missing step instead of skipping it', () => {
    const result = runSteps([], 1, 4, { 1: tag(1), 3: tag(3) });
    expect(result).toEqual({
      ok: false,
      error: [{ path: 'schemaVersion', message: expect.stringContaining('2') }],
    });
  });

  it('turns a step that throws into an issue (D-225: never throws)', () => {
    const failing: MigrationSteps = {
      1: () => {
        throw new TypeError('boom');
      },
    };
    expect(runSteps({}, 1, 2, failing)).toEqual({
      ok: false,
      error: [{ path: '', message: expect.stringContaining('1') }],
    });
  });
});

describe('REQ-DATA-007 data from a newer version opens read-only', () => {
  it('keeps the newer fixture read-only instead of rejecting it (tests/fixtures/state/newer.json)', () => {
    expect(migrate(untrusted(newerFixture))).toEqual({
      ok: false,
      error: { code: 'stateReadOnly', schemaVersion: 2 },
    });
  });

  it('never runs steps or validation on newer data, however it looks', () => {
    const raw = { schemaVersion: 99, siteGroups: 'not a list' };
    const steps: MigrationSteps = { 1: () => expect.fail('a step ran') };
    expect(errorOf(migrate(untrusted(raw), steps))).toEqual({
      code: 'stateReadOnly',
      schemaVersion: 99,
    });
  });

  it('leaves the newer data untouched', () => {
    const raw = untrusted(newerFixture);
    migrate(raw);
    expect(raw).toEqual(newerFixture);
  });
});

describe('REQ-DATA-001 unreadable data is reported with readable issues', () => {
  it('lists every problem in the corrupt fixture (tests/fixtures/state/corrupt.json)', () => {
    expect(pathsIn(migrate(untrusted(corruptFixture))).sort()).toEqual([
      'revision',
      'settings.theme',
      'siteGroups[0].marks[0].color',
      'siteGroups[0].name',
    ]);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['a string', '{"schemaVersion":1}'],
    ['a number', 1],
    ['an array', [1]],
  ])('rejects %s at the root', (_name, raw) => {
    expect(pathsIn(migrate(raw))).toEqual(['']);
  });

  it.each([
    ['missing', {}],
    ['a string', { schemaVersion: '1' }],
    ['a fraction', { schemaVersion: 1.5 }],
    ['not finite', { schemaVersion: Number.POSITIVE_INFINITY }],
  ])('rejects a schemaVersion that is %s', (_name, version) => {
    const { schemaVersion: _, ...rest } = aState();
    expect(pathsIn(migrate({ ...rest, ...version }))).toEqual(['schemaVersion']);
  });

  it('gives each issue a message', () => {
    const issues = issuesOf(migrate(untrusted(corruptFixture)));
    for (const issue of issues) expect(issue.message.trim()).not.toBe('');
  });
});
