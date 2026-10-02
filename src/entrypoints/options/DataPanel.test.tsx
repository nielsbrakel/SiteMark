import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { buildExport } from '@/core/data/export';
import { parseImport } from '@/core/data/import';
import type { SiteGroup, SiteMarkState } from '@/core/model/schema';
import { aRegexPattern, aSiteGroup, aState, aWildcardPattern } from '@/core/testing/builders';
import type { OriginPattern } from '@/core/url/origin';
import { fakes } from '../../../tests/fakes/install';
import { axeViolations } from '../../../tests/unit/axe';
import { atHash, optionsBackground } from '../../../tests/unit/options-background';
import { byLabel, byRole, findRole } from '../../../tests/unit/queries';
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

describe('REQ-OPT-005 REQ-DATA-004 REQ-DATA-005 import: preview, merge or replace, one prompt', () => {
  const [local] = state.siteGroups;
  const regex = aRegexPattern({
    value: '^https://admin\\.example\\.com/',
    origins: ['https://admin.example.com/*' as OriginPattern],
  });
  const staging = aSiteGroup({
    name: 'Staging',
    enabled: false,
    patterns: [aWildcardPattern({ value: 'https://staging.example.com/*' }), regex],
  });
  const fileGroups = [{ ...(local as SiteGroup), name: 'Production (file)' }, staging];
  const exportText = buildExport(aState({ siteGroups: fileGroups, settings: { theme: 'dark' } }), {
    appVersion: '1.2.3',
    now: 0,
  }).json;

  const fileInput = () => byLabel('Choose an export file');
  const importSection = () => byRole('region', { name: 'Import' });
  const groupNames = () =>
    within(byRole('complementary', { name: 'Site groups' }))
      .getAllByRole('link')
      .map((link) => link.textContent);

  function chooseFile(text: string) {
    const file = new File([text], 'sitemark-export.json', { type: 'application/json' });
    fireEvent.change(fileInput(), { target: { files: [file] } });
  }

  it('previews what the file changes before anything is imported', async () => {
    const { background } = await openData();
    chooseFile(exportText);
    await waitFor(() =>
      expect(importSection()).toHaveTextContent('1 site group updated, 1 new site group'),
    );
    expect(importSection()).toHaveTextContent('2 new sites to allow');
    expect(importSection()).toHaveTextContent('^https://admin\\.example\\.com/');
    expect(background.imports).toEqual([]);
    expect(background.state()).toEqual(state);
  });

  it('merges after one prompt for all new origins, asked first (D-229)', async () => {
    const { background } = await openData();
    chooseFile(exportText);
    const apply = await findRole('button', { name: 'Import' }, importSection());
    fireEvent.click(apply);
    expect(fakes().permissions.requests).toEqual([
      ['https://admin.example.com/*', 'https://staging.example.com/*'],
    ]);
    await waitFor(() => expect(groupNames()).toEqual(['Production (file)', 'Staging']));
    expect(background.imports).toEqual(['merge']);
    expect(background.state().settings.theme).toBe('system');
    expect(importSection()).toHaveTextContent('Imported.');
  });

  it('asks before Replace, then replaces site groups and settings', async () => {
    const { background } = await openData(
      aState({ siteGroups: [aSiteGroup({ name: 'Local only' })] }),
    );
    chooseFile(exportText);
    const mode = await findRole('radiogroup', { name: 'Import mode' }, importSection());
    fireEvent.click(byRole('radio', { name: 'Replace' }, mode));
    fireEvent.click(byRole('button', { name: 'Import' }, importSection()));
    const dialog = byRole('dialog', { name: 'Replace all site groups and settings?' });
    expect(background.imports).toEqual([]);
    fireEvent.click(byRole('button', { name: 'Replace' }, dialog));
    await waitFor(() => expect(groupNames()).toEqual(['Production (file)', 'Staging']));
    expect(background.imports).toEqual(['replace']);
    expect(background.state().settings.theme).toBe('dark');
  });

  it.each([
    ['{', 'This file is not valid JSON.'],
    ['{"format":"something-else"}', 'This file is not a valid SiteMark export.'],
  ])('explains why %j cannot be imported and changes nothing', async (text, reason) => {
    const { background } = await openData();
    chooseFile(text);
    expect(await findRole('alert', {}, importSection())).toHaveTextContent(reason);
    expect(within(importSection()).queryByRole('button', { name: 'Import' })).toBeNull();
    expect(background.imports).toEqual([]);
  });
});

describe('REQ-OPT-005 reset everything, after a double confirmation', () => {
  const resetSection = () => byRole('region', { name: 'Reset everything' });
  const openDialog = () =>
    fireEvent.click(byRole('button', { name: 'Reset everything' }, resetSection()));
  const dialog = () => byRole('dialog');
  const revokeBox = () => byRole('switch', { name: "Also remove SiteMark's access to all sites" });

  async function confirmTwice() {
    openDialog();
    expect(dialog()).toHaveAccessibleName('Reset everything?');
    fireEvent.click(byRole('button', { name: 'Continue' }, dialog()));
    await waitFor(() => expect(dialog()).toHaveAccessibleName('Are you sure?'));
    fireEvent.click(byRole('button', { name: 'Reset everything' }, dialog()));
  }

  it('deletes every site group and setting once confirmed twice', async () => {
    const { background } = await openData();
    await confirmTwice();
    await waitFor(() => expect(background.commands).toEqual([{ type: 'resetAll' }]));
    await waitFor(() =>
      expect(
        within(byRole('complementary', { name: 'Site groups' })).queryAllByRole('link'),
      ).toEqual([]),
    );
    expect(resetSection()).toHaveTextContent('SiteMark was reset.');
  });

  it.each([
    ['the first', 0],
    ['the second', 1],
  ])('changes nothing when cancelled at %s step', async (_step, continues) => {
    const { background } = await openData();
    openDialog();
    if (continues) fireEvent.click(byRole('button', { name: 'Continue' }, dialog()));
    fireEvent.click(byRole('button', { name: 'Cancel' }, dialog()));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(background.commands).toEqual([]);
  });

  it('can also remove the access to every site', async () => {
    fakes().permissions.grant('https://prod.example.com/*', '*://intranet/*');
    await openData();
    fireEvent.click(revokeBox());
    await confirmTwice();
    await waitFor(() => expect(fakes().permissions.granted).toEqual([]));
  });

  it('keeps the access to sites by default', async () => {
    fakes().permissions.grant('https://prod.example.com/*');
    const { background } = await openData();
    expect(revokeBox()).not.toBeChecked();
    await confirmTwice();
    await waitFor(() => expect(background.commands).toEqual([{ type: 'resetAll' }]));
    expect(fakes().permissions.granted).toEqual(['https://prod.example.com/*']);
  });
});

describe('REQ-A11Y-002 REQ-OPT-005 the second reset step is read out (WCAG 2.4.3)', () => {
  it('moves focus to the text of the second step when Continue is pressed', async () => {
    await openData();
    fireEvent.click(byRole('button', { name: 'Reset everything' }));
    const dialog = byRole('dialog', { name: 'Reset everything?' });
    const next = byRole('button', { name: 'Continue' }, dialog);
    next.focus();
    fireEvent.click(next);
    await waitFor(() => expect(dialog).toHaveAccessibleName('Are you sure?'));
    await waitFor(() => expect(within(dialog).queryByText(/can't be undone/)).toHaveFocus());
  });
});

describe('REQ-DATA-006 export a single site group', () => {
  it('downloads an export file with only that site group, which imports like any export', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 27, 9, 0));
    const downloads = captureDownloads();
    const [prod] = state.siteGroups;
    const other = aSiteGroup({ name: 'Other' });
    optionsBackground(aState({ siteGroups: [prod as SiteGroup, other] }));
    atHash(`#/groups/${other.id}`);
    render(<OptionsApp />);
    await screen.findByRole('main');
    fireEvent.click(byRole('button', { name: 'Export site group' }));
    await waitFor(() => expect(downloads).toHaveLength(1));
    expect(downloads[0]?.name).toBe('sitemark-site-group-2026-09-27.json');
    const text = (await downloads[0]?.blob?.text()) ?? '';
    expect(JSON.parse(text)).toMatchObject({ format: 'sitemark-export', siteGroups: [other] });
    expect(parseImport(text)).toMatchObject({ ok: true, value: { siteGroups: [other] } });
  });
});
