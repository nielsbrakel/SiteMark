import type { DataErrorCode, RegexErrorCode, UrlPatternErrorCode } from '../errors';
import type { SchemaIssue, SiteGroup, SiteMarkState } from '../model/schema';
import { assertNever, err, ok, type Result } from '../result';
import { parseExportEnvelope } from './export-schema';
import { normalizeImportedPatterns } from './import-patterns';
import { fitsUtf8Bytes, isNestedDeeperThan } from './json-text';
import { CURRENT_VERSION, type MigrationSteps, migrate } from './migrate';

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

type Code<C extends DataErrorCode> = C;

export type ImportError =
  | { readonly code: Code<'importTooLarge' | 'importTooDeep' | 'importInvalidJson'> }
  | { readonly code: Code<'importUnsupportedVersion'>; readonly schemaVersion: number }
  | { readonly code: Code<'importSchemaInvalid'>; readonly issues: readonly SchemaIssue[] }
  | { readonly code: Code<'importPatternInvalid'>; readonly issues: readonly PatternIssue[] };

/** 1 MB (REQ-DATA-004), measured in UTF-8 bytes. */
const MAX_BYTES = 1024 * 1024;
/** A valid file nests 7 levels deep; anything past 32 is hostile (REQ-SEC-004). */
const MAX_DEPTH = 32;

type ImportResult = Result<ImportData, ImportError>;
type Header = { readonly file: Readonly<Record<string, unknown>>; readonly version: number };

const schemaInvalid = (issues: readonly SchemaIssue[]): Result<never, ImportError> =>
  // biome-ignore lint/security/noSecrets: an error code, not a secret.
  err({ code: 'importSchemaInvalid', issues });

function parseJson(text: string): Result<unknown, ImportError> {
  try {
    return ok(JSON.parse(text) as unknown);
  } catch {
    return err({ code: 'importInvalidJson' });
  }
}

/** The format marker and a whole-number schema version, checked before anything else. */
function readHeader(json: unknown): Result<Header, ImportError> {
  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    return schemaInvalid([{ path: '', message: 'Expected a SiteMark export file' }]);
  }
  const file = json as Readonly<Record<string, unknown>>;
  if (file.format !== 'sitemark-export') {
    return schemaInvalid([{ path: 'format', message: 'Expected "sitemark-export"' }]);
  }
  const version = file.schemaVersion;
  if (typeof version !== 'number' || !Number.isSafeInteger(version)) {
    return schemaInvalid([{ path: 'schemaVersion', message: 'Expected a whole-number version' }]);
  }
  return ok({ file, version });
}

/**
 * An older file goes through the one migration pipeline (REQ-DATA-002) as a state: without the
 * envelope-only keys and with revision 0. Only the groups and settings are kept.
 */
function migrateOlder(file: Header['file'], steps?: MigrationSteps): ImportResult {
  const { format: _format, appVersion: _appVersion, exportedAt: _exportedAt, ...rest } = file;
  const migrated = migrate({ ...rest, revision: 0 }, steps);
  if (migrated.ok) {
    const { siteGroups, settings } = migrated.value.state;
    return ok({ siteGroups, settings });
  }
  const { error } = migrated;
  switch (error.code) {
    case 'stateUnreadable':
      return schemaInvalid(error.issues);
    case 'stateReadOnly':
      return err({ code: 'importUnsupportedVersion', schemaVersion: error.schemaVersion });
    default:
      return assertNever(error);
  }
}

function readFile(json: unknown, steps?: MigrationSteps): ImportResult {
  const header = readHeader(json);
  if (!header.ok) return header;
  const { file, version } = header.value;
  if (version > CURRENT_VERSION)
    return err({ code: 'importUnsupportedVersion', schemaVersion: version });
  if (version < CURRENT_VERSION) return migrateOlder(file, steps);
  const envelope = parseExportEnvelope(file);
  if (!envelope.ok) return schemaInvalid(envelope.error);
  const { siteGroups, settings } = envelope.value;
  return ok({ siteGroups, settings });
}

/**
 * Reads an export file's text (REQ-DATA-004): at most 1 MB, nested at most 32 deep, valid JSON, a
 * SiteMark export of this or an older schema version (older ones are migrated), strictly valid
 * (unknown keys and `__proto__` rejected, limits enforced), and every URL pattern accepted by the URL
 * engine (REQ-URL-009). Never throws; an invalid file changes nothing.
 */
export function parseImport(text: string, steps?: MigrationSteps): ImportResult {
  if (!fitsUtf8Bytes(text, MAX_BYTES)) return err({ code: 'importTooLarge' });
  if (isNestedDeeperThan(text, MAX_DEPTH)) return err({ code: 'importTooDeep' });
  const json = parseJson(text);
  if (!json.ok) return json;
  const data = readFile(json.value, steps);
  if (!data.ok) return data;
  const siteGroups = normalizeImportedPatterns(data.value.siteGroups);
  if (!siteGroups.ok) return err({ code: 'importPatternInvalid', issues: siteGroups.error });
  return ok({ siteGroups: siteGroups.value, settings: data.value.settings });
}
