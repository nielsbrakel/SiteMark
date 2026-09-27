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
