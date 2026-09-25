import type { RegexErrorCode, UrlPatternErrorCode } from '../errors';
import type { SchemaIssue, SiteGroup, SiteMarkState } from '../model/schema';
import { notImplemented } from '../not-implemented';
import type { Result } from '../result';
import type { MigrationSteps } from './migrate';

// Import (REQ-DATA-004, REQ-SEC-004, REQ-URL-009): an untrusted file → validated, migrated data.

/** The site groups and settings of a valid import file, at the current schema version. */
export type ImportData = {
  readonly siteGroups: SiteGroup[];
  readonly settings: SiteMarkState['settings'];
};

/** A URL pattern or exclude the URL engine rejects, e.g. `siteGroups[1].patterns[0]`. */
export type PatternIssue = {
  readonly path: string;
  readonly code: UrlPatternErrorCode | RegexErrorCode;
};

export type ImportError =
  | { readonly code: 'importTooLarge' | 'importTooDeep' | 'importInvalidJson' }
  | { readonly code: 'importUnsupportedVersion'; readonly schemaVersion: number }
  | { readonly code: 'importSchemaInvalid'; readonly issues: readonly SchemaIssue[] }
  | { readonly code: 'importPatternInvalid'; readonly issues: readonly PatternIssue[] };

/** Reads an export file's text. Never throws; an invalid file changes nothing. */
export function parseImport(
  _text: string,
  _steps?: MigrationSteps,
): Result<ImportData, ImportError> {
  return notImplemented();
}
