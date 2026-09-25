import type { SiteMarkState } from '../model/schema';
import { notImplemented } from '../not-implemented';
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

export function buildExport(_state: SiteMarkState, _options: ExportOptions): ExportFile {
  return notImplemented();
}

/** `sitemark-export-YYYY-MM-DD.json` for the user's local date. */
export function exportFilename(_date: LocalDate): string {
  return notImplemented();
}
