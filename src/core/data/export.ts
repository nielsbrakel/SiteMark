import type { SiteMarkState } from '../model/schema';
import type { ExportEnvelope } from './export-schema';

// Export (REQ-DATA-003): the envelope and its pretty-printed JSON; the UI only downloads it locally.

export type ExportOptions = {
  /** The SiteMark version, e.g. from the manifest. */
  readonly appVersion: string;
  /** The export time in epoch milliseconds (`Clock.now()`). */
  readonly now: number;
};

export type ExportFile = {
  readonly envelope: ExportEnvelope;
  /** The envelope as JSON with a 2-space indent and a final newline. */
  readonly json: string;
};

/** A calendar date in the user's time zone; `month` is 1..12. Core can't read the time zone. */
export type LocalDate = { readonly year: number; readonly month: number; readonly day: number };

/** The whole state except its revision, which only counts local commands. */
export function buildExport(state: SiteMarkState, { appVersion, now }: ExportOptions): ExportFile {
  const envelope: ExportEnvelope = {
    format: 'sitemark-export',
    schemaVersion: state.schemaVersion,
    appVersion,
    exportedAt: new Date(now).toISOString(),
    siteGroups: state.siteGroups,
    settings: state.settings,
  };
  return { envelope, json: `${JSON.stringify(envelope, null, 2)}\n` };
}

const pad = (value: number, width: number): string => String(value).padStart(width, '0');

/** `sitemark-export-YYYY-MM-DD.json` for the user's local date. */
export function exportFilename({ year, month, day }: LocalDate): string {
  return `sitemark-export-${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}.json`;
}
