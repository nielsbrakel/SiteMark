import { describe, expect, it } from 'vitest';
import { backgroundHarness } from '../../../tests/support/background-harness';
import type { MarkId, SiteGroupId } from '../../core/ids';
import { emptyState } from '../../core/model/defaults';
import type { ElementMark, Hex, SiteGroup, SiteMarkState } from '../../core/model/schema';
import { err, ok } from '../../core/result';
import {
  anElementMark,
  aPageMark,
  aSiteGroup,
  aState,
  aWildcardPattern,
} from '../../core/testing/builders';
import type { ContentSender, SavePick } from '../protocol';
import { savePick } from './save-pick';

const sender: ContentSender = {
  tabId: 7,
  url: 'https://checkout.example.com:8443/cart?step=2',
  origin: 'https://checkout.example.com:8443',
};

const RED = '#c93a2e' as Hex;
const pick: SavePick = { selector: '#pay > button', effects: ['outline'], color: RED };

const shop = aSiteGroup({
  name: 'Shop',
  patterns: [aWildcardPattern({ value: '*://checkout.example.com:8443/*' })],
});
const elsewhere = aSiteGroup({
  name: 'Elsewhere',
  patterns: [aWildcardPattern({ value: 'https://other.example.org/*' })],
});

function setup(siteGroups: SiteGroup[] = [shop, elsewhere]) {
  const harness = backgroundHarness({ state: aState({ siteGroups }) });
  return { ...harness, deps: { queue: harness.queue, idGen: harness.idGen } };
}

const groupNamed = (state: SiteMarkState, name: string) =>
  state.siteGroups.find((group) => group.name === name);

describe('REQ-PICK-005 a pick is saved to the chosen active site group', () => {
  it('adds an element mark with the chosen color and effects, and returns its ID', async () => {
    const { deps, stored } = setup();
    const result = await savePick(deps, { ...pick, siteGroupId: shop.id }, sender);
    expect(result).toEqual(ok('mark00000001'));
    expect(groupNamed(await stored(), 'Shop')?.marks).toEqual([
      {
        id: 'mark00000001',
        enabled: true,
        color: RED,
        textColor: 'auto',
        target: { kind: 'element', selector: '#pay > button' },
        effects: { outline: { widthPx: 3, style: 'solid', pulse: false } },
      },
    ]);
  });

  it('gives each effect chip its default settings; the ribbon shows the host', async () => {
    const { deps, stored } = setup();
    const effects = ['ribbon', 'outline', 'tint', 'stripes'] as const;
    await savePick(deps, { ...pick, siteGroupId: shop.id, effects }, sender);
    expect(groupNamed(await stored(), 'Shop')?.marks[0]?.effects).toEqual({
      ribbon: { text: 'checkout.example', corner: 'top-right' },
      outline: { widthPx: 3, style: 'solid', pulse: false },
      tint: { opacityPct: 20 },
      stripes: { opacityPct: 20 },
    });
  });

  it('refuses a full site group (50 marks)', async () => {
    const full = { ...shop, marks: Array.from({ length: 50 }, () => anElementMark()) };
    const { deps, repo } = setup([full]);
    const result = await savePick(deps, { ...pick, siteGroupId: shop.id }, sender);
    expect(result).toEqual(err('markLimitReached'));
    expect(repo.saves).toEqual([]);
  });

  it('refuses while the data is read-only (REQ-DATA-007)', async () => {
    const harness = backgroundHarness({
      loaded: { mode: 'readOnly', state: emptyState(), schemaVersion: 2 },
    });
    const deps = { queue: harness.queue, idGen: harness.idGen };
    expect(await savePick(deps, pick, sender)).toEqual(err('stateReadOnly'));
  });
});

describe('REQ-PICK-005 REQ-SEC-001 otherwise the pick gets a new site group for the sender origin', () => {
  it('adds an enabled group named after the host, for exactly this host and port', async () => {
    const { deps, stored } = setup();
    expect(await savePick(deps, pick, sender)).toEqual(ok('mark00000001'));
    const state = await stored();
    expect(state.siteGroups.map((group) => group.name)).toEqual([
      'Shop',
      'Elsewhere',
      'checkout.example.com',
    ]);
    expect(state.siteGroups[2]).toMatchObject({
      id: 'group0000001',
      enabled: true,
      patterns: [{ kind: 'wildcard', value: '*://checkout.example.com:8443/*' }],
      excludes: [],
      marks: [{ id: 'mark00000001', target: { kind: 'element', selector: '#pay > button' } }],
    });
  });

  it.each([
    ['a group of another site', elsewhere.id],
    ['a group that does not exist', 'grpmissing01' as SiteGroupId],
  ])('never adds to %s: the origin comes from the sender', async (_name, siteGroupId) => {
    const { deps, stored } = setup();
    await savePick(deps, { ...pick, siteGroupId }, sender);
    const state = await stored();
    expect(groupNamed(state, 'Elsewhere')?.marks).toEqual([]);
    expect(state.siteGroups.at(-1)?.name).toBe('checkout.example.com');
  });

  it.each([
    ['disabled', { ...shop, enabled: false }],
    [
      'excluded on this URL',
      { ...shop, excludes: [aWildcardPattern({ value: '*://checkout.example.com:8443/cart*' })] },
    ],
  ])('treats a group that is %s as not active', async (_name, group) => {
    const { deps, stored } = setup([group]);
    await savePick(deps, { ...pick, siteGroupId: shop.id }, sender);
    const state = await stored();
    expect(state.siteGroups[0]?.marks).toEqual([]);
    expect(state.siteGroups).toHaveLength(2);
  });

  it('omits the default port from the pattern', async () => {
    const { deps, stored } = setup([]);
    const https = { tabId: 1, url: 'https://example.com/a', origin: 'https://example.com' };
    await savePick(deps, pick, https);
    expect((await stored()).siteGroups[0]?.patterns[0]?.value).toBe('*://example.com/*');
  });

  it('refuses a 201st site group', async () => {
    const { deps } = setup(Array.from({ length: 200 }, () => aSiteGroup()));
    expect(await savePick(deps, pick, sender)).toEqual(err('siteGroupLimitReached'));
  });
});

describe('REQ-PICK-007 a re-pick replaces the selector of that mark', () => {
  const lost = anElementMark({
    label: 'Pay button',
    color: RED,
    target: { kind: 'element', selector: '#old' },
  });
  const banner = aPageMark();
  const withMarks = { ...shop, marks: [banner, lost] };

  it('keeps the mark ID, position, color and effects', async () => {
    const { deps, stored } = setup([withMarks]);
    const repick = { ...pick, color: '#000000' as Hex, effects: ['tint'] as const };
    const result = await savePick(deps, { ...repick, repickMarkId: lost.id }, sender);
    expect(result).toEqual(ok(lost.id));
    const marks = (await stored()).siteGroups[0]?.marks;
    expect(marks).toEqual([
      banner,
      { ...lost, target: { kind: 'element', selector: '#pay > button' } } satisfies ElementMark,
    ]);
  });

  const foreign = anElementMark();
  it.each([
    ['a mark of a group that is not active here', foreign.id],
    ['a page mark', banner.id],
    ['an unknown mark', 'mrkmissing01' as MarkId],
  ])('refuses %s and changes nothing', async (_name, repickMarkId) => {
    const { deps, repo } = setup([withMarks, { ...elsewhere, marks: [foreign] }]);
    const result = await savePick(deps, { ...pick, repickMarkId }, sender);
    expect(result).toEqual(err('markNotFound'));
    expect(repo.saves).toEqual([]);
  });
});
