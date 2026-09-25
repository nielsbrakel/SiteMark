import type { SchemaIssue, SiteMarkState } from '../model/schema';
import { notImplemented } from '../not-implemented';
import type { Result } from '../result';

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
  | { readonly code: 'stateReadOnly'; readonly schemaVersion: number }
  /** Not a readable state: back up the raw data and fall back to defaults (REQ-DATA-001). */
  | { readonly code: 'stateUnreadable'; readonly issues: readonly SchemaIssue[] };

/** Runs `steps[from]`, `steps[from + 1]`, … up to version `to`. Never throws. */
export function runSteps(
  _data: unknown,
  _from: number,
  _to: number,
  _steps: MigrationSteps,
): Result<unknown, SchemaIssue[]> {
  return notImplemented();
}

/** Detects the schema version, migrates older data to the current one and validates it. */
export function migrate(_raw: unknown, _steps?: MigrationSteps): Result<MigrateOk, MigrateError> {
  return notImplemented();
}
