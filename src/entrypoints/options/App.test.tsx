import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { aState } from '@/core/testing/builders';
import corrupt from '../../../tests/fixtures/state/corrupt.json';
import newer from '../../../tests/fixtures/state/newer.json';
import { atHash, optionsBackground } from '../../../tests/unit/options-background';
import { byRole, findRole } from '../../../tests/unit/queries';
import { OptionsApp } from './App';

const STATE_KEY = 'sitemark:state';

/** Captures what the page downloads: the file name and the text behind the object URL. */
function captureDownloads() {
  const blobs = new Map<string, Blob>();
  const downloads: { name: string; blob: Blob | undefined }[] = [];
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    const url = `blob:test/${blobs.size}`;
    blobs.set(url, blob as Blob);
    return url;
  });
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    downloads.push({ name: this.download, blob: blobs.get(this.href) });
  });
  return downloads;
}

async function openWithStored(raw: unknown, backups: Record<string, unknown> = {}) {
  await fakeBrowser.storage.local.set({ [STATE_KEY]: raw, ...backups });
  // What the background answers for unreadable data: the defaults (REQ-DATA-001).
  const background = optionsBackground(aState({ siteGroups: [] }));
  atHash('');
  render(<OptionsApp />);
  return background;
}

beforeEach(() => atHash(''));

describe('REQ-DATA-001 unreadable data: a recoverable error with the backup', () => {
  const backup = { 'sitemark:backup:0': { savedAt: 1, raw: corrupt } };

  it('says the data could not be read, while the page keeps working with defaults', async () => {
    await openWithStored(corrupt, backup);
    const banner = await findRole('alert');
    expect(banner).toHaveTextContent(
      "SiteMark couldn't read its saved data, so it started with the defaults.",
    );
    expect(byRole('main')).toHaveTextContent('No site groups yet.');
  });

  it('downloads the backup', async () => {
    const downloads = captureDownloads();
    await openWithStored(corrupt, backup);
    fireEvent.click(await findRole('button', { name: 'Download backup' }));
    await waitFor(() => expect(downloads).toHaveLength(1));
    expect(downloads[0]?.name).toMatch(/^sitemark-backup-\d{4}-\d{2}-\d{2}\.json$/);
    expect(JSON.parse((await downloads[0]?.blob?.text()) ?? '')).toEqual(corrupt);
  });

  it('restores the defaults for good, which ends the error', async () => {
    const background = await openWithStored(corrupt, backup);
    fireEvent.click(await findRole('button', { name: 'Restore defaults' }));
    await waitFor(() => expect(background.commands).toEqual([{ type: 'resetAll' }]));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});

describe('REQ-DATA-007 data from a newer SiteMark opens read-only', () => {
  it('explains why nothing can be changed, without the editor', async () => {
    await openWithStored(newer);
    const banner = await findRole('alert');
    expect(banner).toHaveTextContent(
      'Your settings were saved by a newer version of SiteMark (data version 2).',
    );
    expect(screen.queryByRole('main')).toBeNull();
  });

  it('downloads a copy of the data', async () => {
    const downloads = captureDownloads();
    await openWithStored(newer);
    fireEvent.click(await findRole('button', { name: 'Download a copy' }));
    await waitFor(() => expect(downloads).toHaveLength(1));
    expect(JSON.parse((await downloads[0]?.blob?.text()) ?? '')).toEqual(newer);
  });
});
