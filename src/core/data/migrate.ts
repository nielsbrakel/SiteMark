import type { DataErrorCode } from '../errors';
import { parseState, type SchemaIssue, type SiteMarkState } from '../model/schema';
import { err, ok, type Result } from '../result';

// One migration pipeline for stored state and imports (REQ-DATA-002, D-224).

/** Turns data of schema version N into version N + 1. Must not mutate its input. */
export type MigrationStep = (data: unknown) => unknown;
/** `steps[N]` migrates version N to N + 1. */
export type MigrationSteps = Readonly<Record<number, MigrationStep>>;

export type MigrateOk = {
  readonly state: SiteMarkState;
  /** The schema version the data had; lower than `state.schemaVersion` when steps ran. */
  readonly fromVersion: number;
};

export type MigrateError =
  /** Written by a newer SiteMark: keep the raw data untouched and open read-only (REQ-DATA-007). */
  | { readonly code: Extract<DataErrorCode, 'stateReadOnly'>; readonly schemaVersion: number }
  /** Not a readable state: back up the raw data and fall back to defaults (REQ-DATA-001). */
  | {
      readonly code: Extract<DataErrorCode, 'stateUnreadable'>;
      readonly issues: readonly SchemaIssue[];
    };

const CURRENT_VERSION: SiteMarkState['schemaVersion'] = 1;

/**
 * The production registry. v1 is the only version so far; a v2 adds `1: v1ToV2` here, bumps the
 * schema, and tests the step against tests/fixtures/state/v1.json (REQ-DATA-002).
 */
const migrationSteps: MigrationSteps = {};

function applyStep(step: MigrationStep, data: unknown, version: number) {
  try {
    return ok(step(data));
  } catch {
    return err([{ path: '', message: `Migrating from schema version ${version} failed` }]);
  }
}

/** Runs `steps[from]`, `steps[from + 1]`, … up to version `to`. Never throws. */
export function runSteps(
  data: unknown,
  from: number,
  to: number,
  steps: MigrationSteps,
): Result<unknown, SchemaIssue[]> {
  let current = data;
  for (let version = from; version < to; version += 1) {
    const step = steps[version];
    if (!step) {
      return err([
        { path: 'schemaVersion', message: `No migration from schema version ${version}` },
      ]);
    }
    const next = applyStep(step, current, version);
    if (!next.ok) return next;
    current = next.value;
  }
  return ok(current);
}

function detectVersion(raw: unknown): Result<number, SchemaIssue[]> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return err([{ path: '', message: 'Expected an object with a schemaVersion' }]);
  }
  const version: unknown = (raw as { schemaVersion?: unknown }).schemaVersion;
  if (typeof version !== 'number' || !Number.isSafeInteger(version)) {
    return err([{ path: 'schemaVersion', message: 'Expected a whole-number schema version' }]);
  }
  return ok(version);
}

const unreadable = (issues: readonly SchemaIssue[]): Result<never, MigrateError> =>
  err({ code: 'stateUnreadable', issues });

/**
 * Detects the schema version, migrates older data to the current one and validates it. Newer data
 * is never migrated or validated: the caller keeps it as it is and opens read-only.
 */
export function migrate(
  raw: unknown,
  steps: MigrationSteps = migrationSteps,
): Result<MigrateOk, MigrateError> {
  const version = detectVersion(raw);
  if (!version.ok) return unreadable(version.error);
  const fromVersion = version.value;
  if (fromVersion > CURRENT_VERSION)
    return err({ code: 'stateReadOnly', schemaVersion: fromVersion });
  const migrated = runSteps(raw, fromVersion, CURRENT_VERSION, steps);
  if (!migrated.ok) return unreadable(migrated.error);
  const state = parseState(migrated.value);
  return state.ok ? ok({ state: state.value, fromVersion }) : unreadable(state.error);
}
