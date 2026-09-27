/**
 * Saves `text` as a local file named `filename` (REQ-DATA-003): an object URL clicked through a
 * detached link. Nothing leaves the device (REQ-PRIV-005).
 */
export function downloadText(filename: string, text: string, type = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  // The click has started the download; the URL isn't needed any more.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

const pad = (value: number) => String(value).padStart(2, '0');

/** `<prefix>-YYYY-MM-DD.json` for the user's local date, e.g. `sitemark-backup-2026-09-27.json`. */
export function datedJsonName(prefix: string, now: Date = new Date()): string {
  return `${prefix}-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

/** Downloads a value as pretty JSON (the raw data of a backup, as it was stored). */
export function downloadJson(prefix: string, value: unknown): void {
  downloadText(datedJsonName(prefix), `${JSON.stringify(value, null, 2)}\n`);
}
