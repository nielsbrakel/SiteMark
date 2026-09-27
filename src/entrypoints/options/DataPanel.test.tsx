import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import type { SiteMarkState } from '@/core/model/schema';
import { aSiteGroup, aState } from '@/core/testing/builders';
import { axeViolations } from '../../../tests/unit/axe';
import { atHash, optionsBackground } from '../../../tests/unit/options-background';
import { byRole } from '../../../tests/unit/queries';
import { OptionsApp } from './App';

const state = aState({ revision: 12, siteGroups: [aSiteGroup({ name: 'Production' })] });

async function openData(initial: SiteMarkState = state) {
  const background = optionsBackground(initial);
  atHash('#/data');
  const view = render(<OptionsApp />);
  await screen.findByRole('main');
  return { background, container: view.container };
}

/** Captures what the page downloads: the file name and the blob behind the object URL. */
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

beforeEach(() => {
  atHash('');
  vi.spyOn(fakeBrowser.runtime, 'getManifest').mockReturnValue({
    manifest_version: 3,
    name: 'SiteMark',
    version: '1.2.3',
  });
});
afterEach(() => vi.useRealTimers());

describe('REQ-OPT-005 REQ-DATA-003 export', () => {
  it('downloads the site groups and settings as sitemark-export-<local date>.json', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const now = new Date(2026, 8, 27, 10, 30);
    vi.setSystemTime(now);
    const downloads = captureDownloads();
    await openData();
    fireEvent.click(byRole('button', { name: 'Export' }));
    await waitFor(() => expect(downloads).toHaveLength(1));
    const [file] = downloads;
    expect(file?.name).toBe('sitemark-export-2026-09-27.json');
    const text = (await file?.blob?.text()) ?? '';
    expect(text.endsWith('}\n')).toBe(true);
    expect(JSON.parse(text)).toEqual({
      format: 'sitemark-export',
      schemaVersion: 1,
      appVersion: '1.2.3',
      exportedAt: now.toISOString(),
      siteGroups: state.siteGroups,
      settings: state.settings,
    });
    expect(text).toContain('\n  "format"');
  });

  it('warns that exports contain internal host names', async () => {
    await openData();
    expect(byRole('main')).toHaveTextContent('Exports contain internal host names.');
  });

  it('has no axe violations', async () => {
    const { container } = await openData();
    byRole('button', { name: 'Export' });
    expect(await axeViolations(container)).toEqual([]);
  });
});
