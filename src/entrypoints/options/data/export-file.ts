import { browser } from 'wxt/browser';
import { buildExport, exportFilename } from '@/core/data/export';
import { emptyState } from '@/core/model/defaults';
import type { SiteGroup, SiteMarkState } from '@/core/model/schema';
import { datedJsonName, downloadText } from './download';

// Export files (REQ-DATA-003, REQ-DATA-006): the core's envelope, downloaded locally.

function download(state: SiteMarkState, filename: string, now: Date): void {
  const file = buildExport(state, {
    appVersion: browser.runtime.getManifest().version,
    now: now.getTime(),
  });
  downloadText(filename, file.json);
}

/** Everything: `sitemark-export-YYYY-MM-DD.json` for the user's local date. */
export function exportAll(state: SiteMarkState): void {
  const now = new Date();
  const date = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
  download(state, exportFilename(date), now);
}

/**
 * One site group (REQ-DATA-006): a regular export file with only that group and the default
 * settings, so importing it with Merge adds or updates just that group.
 */
export function exportSiteGroup(group: SiteGroup): void {
  const now = new Date();
  download(
    { ...emptyState(), siteGroups: [group] },
    datedJsonName('sitemark-site-group', now),
    now,
  );
}
