import { describe, expect, it } from 'vitest';
import { backgroundHarness, MARKER_FILES } from '../../../tests/support/background-harness';
import { buildExport } from '../../core/data/export';
import { emptyState } from '../../core/model/defaults';
import type { SiteGroup, SiteMarkState } from '../../core/model/schema';
import { aRegexPattern, aSiteGroup, aState, aWildcardPattern } from '../../core/testing/builders';
import type { OriginPattern } from '../../core/url/origin';
import type { InMemoryTab } from '../testing/in-memory-tabs';
import { applyImportFile, previewImportFile } from './import-data';

const LOCAL = '*://local.example.com/*';
const GRANTED = '*://granted.example.com/*';
const FRESH = '*://fresh.example.com/*';
const REGEX_ORIGIN = 'https://api.example.net/*';

const groupFor = (value: string, name = 'Imported') =>
  aSiteGroup({ name, patterns: [aWildcardPattern({ value })] });

const local = groupFor(LOCAL, 'Local');
const regexGroup = aSiteGroup({
  name: 'Regex',
  patterns: [
    aRegexPattern({
      value: '^https://api\\.example\\.net/v2/',
      origins: [REGEX_ORIGIN as OriginPattern],
    }),
  ],
});

/** An export file with these groups and a dark theme. */
function fileWith(...siteGroups: SiteGroup[]): string {
  const state: SiteMarkState = { ...aState({ siteGroups }), settings: { theme: 'dark' } };
  return buildExport(state, { appVersion: '1.0.0', now: Date.UTC(2026, 8, 1) }).json;
}

function setup(options: { granted?: string[]; tabs?: InMemoryTab[]; state?: SiteMarkState } = {}) {
  const harness = backgroundHarness({
    state: options.state ?? aState({ siteGroups: [local] }),
    granted: options.granted ?? [LOCAL, GRANTED],
    tabs: options.tabs ?? [],
  });
  const deps = { ...harness, stateRepo: harness.repo };
  return { ...harness, deps };
}

describe('REQ-DATA-005 the import preview lists the new origins that still need a grant', () => {
  it('counts updated and new groups, highlights regexes and lists ungranted new origins', async () => {
    const { deps, repo } = setup();
    const text = fileWith(
      { ...local, name: 'Local v2' },
      groupFor(GRANTED),
      groupFor(FRESH),
      regexGroup,
    );
    const preview = await previewImportFile(deps, { text });
    expect(preview).toEqual({
      ok: true,
      value: {
        updated: 1,
        added: 3,
        originsToRequest: [FRESH, REGEX_ORIGIN].sort(),
        regexPatterns: [expect.objectContaining({ siteGroupId: regexGroup.id, list: 'patterns' })],
      },
    });
    expect(repo.saves).toEqual([]);
  });

  it('reports an invalid file and changes nothing', async () => {
    const { deps, repo } = setup();
    expect(await previewImportFile(deps, { text: '{ nope' })).toEqual({
      ok: false,
      error: { code: 'importInvalidJson' },
    });
    expect(repo.saves).toEqual([]);
  });
});

describe('REQ-DATA-005 applying an import goes through the queue (REQ-DATA-004)', () => {
  it('merges: updates by ID, appends new groups and keeps the local settings', async () => {
    const { deps, stored } = setup();
    const text = fileWith({ ...local, name: 'Local v2' }, groupFor(FRESH, 'Fresh'));
    expect(await applyImportFile(deps, { text, mode: 'merge' })).toEqual({
      ok: true,
      value: { revision: 1, notices: [] },
    });
    const state = await stored();
    expect(state.siteGroups.map((group) => group.name)).toEqual(['Local v2', 'Fresh']);
    expect(state.settings.theme).toBe('system');
  });

  it('replaces: the file groups and settings replace the local ones', async () => {
    const { deps, stored } = setup();
    await applyImportFile(deps, { text: fileWith(groupFor(FRESH, 'Fresh')), mode: 'replace' });
    const state = await stored();
    expect(state.siteGroups.map((group) => group.name)).toEqual(['Fresh']);
    expect(state.settings.theme).toBe('dark');
  });

  it('refuses an invalid file and changes nothing', async () => {
    const { deps, repo } = setup();
    const result = await applyImportFile(deps, { text: '[]', mode: 'merge' });
    expect(result.ok).toBe(false);
    expect(repo.saves).toEqual([]);
  });

  it('refuses while the data is read-only (REQ-DATA-007)', async () => {
    const harness = backgroundHarness({
      loaded: { mode: 'readOnly', state: emptyState(), schemaVersion: 2 },
    });
    const deps = { ...harness, stateRepo: harness.repo };
    const result = await applyImportFile(deps, { text: fileWith(local), mode: 'merge' });
    expect(result).toEqual({ ok: false, error: { code: 'stateReadOnly' } });
  });

  it('refuses a merge past 200 site groups', async () => {
    const full = Array.from({ length: 200 }, () => aSiteGroup());
    const { deps } = setup({ state: aState({ siteGroups: full }) });
    const result = await applyImportFile(deps, { text: fileWith(groupFor(FRESH)), mode: 'merge' });
    expect(result).toEqual({ ok: false, error: { code: 'siteGroupLimitReached' } });
  });

  it('completes the grant for new origins the user allowed before the import landed', async () => {
    const tabs = [
      { id: 1, url: 'https://fresh.example.com/app' },
      { id: 2, url: 'https://local.example.com/' },
    ];
    const { deps, permissions, registrar, tabs: openTabs } = setup({ tabs });
    permissions.grant(FRESH);
    await applyImportFile(deps, { text: fileWith(groupFor(FRESH)), mode: 'merge' });
    expect(registrar.current?.matches).toContain(FRESH);
    expect(openTabs.injections).toEqual([{ tabId: 1, files: [...MARKER_FILES] }]);
  });
});
