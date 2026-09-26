import type { ZodType } from 'zod';
import { parseWith } from '../model/issues';
import type { SchemaResult, SiteGroup, SiteMarkState } from '../model/schema';
import { settingsSchema, siteGroupsSchema } from '../model/state-schema';
import { reportDuplicateIds } from '../model/unique-ids';
import { z } from '../model/zod';

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

/** A manifest version: 1 to 4 dot-separated whole numbers. */
const APP_VERSION = /^\d{1,9}(\.\d{1,9}){0,3}$/;

const exportEnvelopeSchema: ZodType<ExportEnvelope> = z
  .strictObject({
    format: z.literal('sitemark-export'),
    schemaVersion: z.literal(1),
    appVersion: z.string().regex(APP_VERSION, 'Expected a version like 1.2.3'),
    exportedAt: z.iso.datetime({ error: 'Expected a UTC time like 2026-09-25T14:30:05.123Z' }),
    siteGroups: siteGroupsSchema,
    settings: settingsSchema,
  })
  .superRefine(reportDuplicateIds);

/** Validates an export envelope strictly: unknown keys are rejected at every level. */
export function parseExportEnvelope(input: unknown): SchemaResult<ExportEnvelope> {
  return parseWith(exportEnvelopeSchema, input);
}
