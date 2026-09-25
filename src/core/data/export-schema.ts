import type { SchemaResult, SiteGroup, SiteMarkState } from '../model/schema';
import { notImplemented } from '../not-implemented';

// The export file format (spec §7, REQ-DATA-003). Import (REQ-DATA-004) parses the same envelope.

export type ExportEnvelope = {
  format: 'sitemark-export';
  schemaVersion: SiteMarkState['schemaVersion'];
  /** The SiteMark version that wrote the file, e.g. `1.2.3`. */
  appVersion: string;
  /** UTC ISO 8601, e.g. `2026-09-25T14:30:05.123Z`. */
  exportedAt: string;
  siteGroups: SiteGroup[];
  settings: SiteMarkState['settings'];
};

/** Validates an export envelope strictly: unknown keys are rejected at every level. */
export function parseExportEnvelope(_input: unknown): SchemaResult<ExportEnvelope> {
  return notImplemented();
}
