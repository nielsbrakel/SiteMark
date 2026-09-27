import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import type { TabStatusAnswer } from '@/app/protocol';
import type { Hex, SiteGroup } from '@/core/model/schema';
import type { TabStatus } from '@/core/render/status';
import { err } from '@/core/result';
import {
  anElementMark,
  aPageMark,
  aRegexPattern,
  aSiteGroup,
  aState,
  aWildcardPattern,
} from '@/core/testing/builders';
import type { OriginPattern } from '@/core/url/origin';
import { grantPageUrl } from '@/platform/grant-page';
import { fakes } from '../../../tests/fakes/install';
import { axeViolations } from '../../../tests/unit/axe';
import { activeTab, fakeBackground, shown } from '../../../tests/unit/popup-harness';
import { PopupApp } from './App';

const PAGE = 'https://app.example.com:8443/orders';

const group = (name: string, pattern: string, overrides: Parameters<typeof aSiteGroup>[0] = {}) =>
  aSiteGroup({ name, patterns: [aWildcardPattern({ value: pattern })], ...overrides });

const production = group('Production', 'https://*.example.com/*', {
  marks: [aPageMark({ color: '#c93a2e' as Hex })],
});
const payments = group('Payments admin', '*://app.example.com/*', { enabled: false });
const elsewhere = group('Elsewhere', 'https://other.example.org/*');

/** Opens the popup on `url` with the background answering `state`. */
async function openPopup(url: string | undefined, ...siteGroups: ReturnType<typeof aSiteGroup>[]) {
  const background = fakeBackground({ state: aState({ siteGroups }) });
  const tabId = await activeTab(url);
  const view = render(<PopupApp />);
  return { background, tabId, view };
}

const groupList = () => screen.findByRole('list', { name: 'Site groups on this site' });
/** The groups' own list items (each may hold a nested list of element marks). */
const items = async () => {
  const list = await groupList();
  return within(list)
    .getAllByRole('listitem')
    .filter((item) => item.parentElement === list);
};
const chipColor = (item: HTMLElement) =>
  item
    .querySelector<HTMLElement>('[aria-hidden="true"]')
    ?.style.getPropertyValue('--sm-chip-color');

/** Clicks the button once it shows. */
const click = async (name: string) =>
  fireEvent.click(await shown(() => screen.queryByRole('button', { name })));

afterEach(() => document.documentElement.removeAttribute('data-theme'));

describe('REQ-POP-001 REQ-URL-006 the popup lists every site group whose patterns match the tab', () => {
  it('shows the host and each matching group by priority, with its color and name', async () => {
    await openPopup(PAGE, production, elsewhere, payments);
    expect(await screen.findByText('app.example.com:8443')).toBeInTheDocument();
    const [first, second, ...rest] = await items();
    expect(rest).toEqual([]);
    expect(first).toHaveTextContent('Production');
    expect(first && chipColor(first)).toBe('#c93a2e');
    expect(second).toHaveTextContent('Payments admin');
  });

  it('lists a disabled group as "Disabled — enable in settings", linking to that group', async () => {
    await openPopup(PAGE, payments);
    const [item] = await items();
    expect(item).toHaveTextContent('Payments admin Disabled — enable in settings');
    const link = within(item as HTMLElement).getByRole('link', { name: 'enable in settings' });
    expect(link).toHaveAttribute(
      'href',
      `${fakeBrowser.runtime.getURL('/options.html')}#/groups/${payments.id}`,
    );
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('keeps listing a group whose excludes match the page (D-263)', async () => {
    const excluded = group('Excluded here', 'https://app.example.com:8443/*', {
      excludes: [aWildcardPattern({ value: 'https://app.example.com:8443/orders' })],
    });
    await openPopup(PAGE, excluded);
    const [item] = await items();
    expect(item).toHaveTextContent('Excluded here');
  });

  it('says when no site group matches and offers Mark this site', async () => {
    await openPopup(PAGE, elsewhere);
    expect(await screen.findByText('No site group matches this site')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark this site' })).toBeEnabled();
    expect(
      screen.getByText('Your browser will ask to let SiteMark show marks on this site.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('list', { name: 'Site groups on this site' }),
    ).not.toBeInTheDocument();
  });

  it('has no axe violations with groups and without', async () => {
    const withGroups = await openPopup(PAGE, production, payments);
    await groupList();
    expect(await axeViolations(withGroups.view.container)).toEqual([]);
    withGroups.view.unmount();
    withGroups.background.state = aState({ siteGroups: [] });
    const empty = render(<PopupApp />);
    await screen.findByText('No site group matches this site');
    expect(await axeViolations(empty.container)).toEqual([]);
  });
});

describe('REQ-THEME-001 the popup follows the theme setting', () => {
  it('applies the stored theme', async () => {
    fakeBackground({ state: aState({ siteGroups: [], settings: { theme: 'dark' } }) });
    await activeTab(PAGE);
    render(<PopupApp />);
    await screen.findByText('No site group matches this site');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });
});

describe('REQ-POP-006 REQ-PRIV-002 Mark this site prompts first, then asks the background (D-229)', () => {
  it('requests the host synchronously in the click, then sends markThisSite for the tab', async () => {
    const { background, tabId } = await openPopup(PAGE, elsewhere);
    await click('Mark this site');
    expect(fakes().permissions.requests).toEqual([['*://app.example.com/*']]);
    await waitFor(() => expect(background.sent('markThisSite')).toHaveLength(1));
    expect(background.sent('markThisSite')).toEqual([
      {
        type: 'markThisSite',
        data: { tabId, origin: { hostname: 'app.example.com', port: '8443' } },
      },
    ]);
    const index = background.received.findIndex(({ type }) => type === 'markThisSite');
    expect(background.promptsBefore[index]).toBe(1);
  });

  it('does not wait for the answer to the prompt, and shows the new group once it is stored', async () => {
    // The user hasn't answered the prompt yet.
    vi.spyOn(fakes().permissions.api, 'request').mockReturnValue(new Promise(() => undefined));
    const { background } = await openPopup(PAGE, elsewhere);
    await click('Mark this site');
    await waitFor(() => expect(background.sent('markThisSite')).toHaveLength(1));
    const added = group('app.example.com', '*://app.example.com:8443/*');
    await background.commit(aState({ revision: 1, siteGroups: [elsewhere, added] }));
    const [item] = await items();
    expect(item).toHaveTextContent('app.example.com');
  });

  it('explains why when the background refuses', async () => {
    const { background } = await openPopup(PAGE, elsewhere);
    background.markThisSite = () => err('siteGroupLimitReached');
    await click('Mark this site');
    const alert = await shown(() => screen.queryByRole('alert'));
    expect(alert).toHaveTextContent('You can have at most 200 site groups.');
  });

  it('says so when the background does not answer', async () => {
    await openPopup(PAGE, elsewhere);
    await shown(() => screen.queryByRole('button', { name: 'Mark this site' }));
    fakeBrowser.runtime.onMessage.removeAllListeners();
    await click('Mark this site');
    const alert = await shown(() => screen.queryByRole('alert'));
    expect(alert).toHaveTextContent("SiteMark didn't respond. Close this popup and try again.");
  });
});

describe('REQ-POP-004 REQ-POP-006 the popup asks for access the matching site groups need', () => {
  const NEEDS_ACCESS =
    'SiteMark needs access to app.example.com to show your marks on every visit.';
  const notice = () => shown(() => screen.queryByText(NEEDS_ACCESS));

  it('explains that access is missing and offers Allow', async () => {
    await openPopup(PAGE, production);
    expect(await notice()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Allow' })).toBeEnabled();
  });

  it('says nothing when every origin the page needs is granted', async () => {
    fakes().permissions.grant('https://*.example.com/*');
    await openPopup(PAGE, production);
    await groupList();
    expect(screen.queryByText(NEEDS_ACCESS)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Allow' })).not.toBeInTheDocument();
  });

  it('asks only for the origins of enabled groups whose patterns cover the page', async () => {
    const regex = aSiteGroup({
      name: 'Admin pages',
      patterns: [
        aRegexPattern({
          value: '^https://app\\.example\\.com:8443/',
          origins: ['https://app.example.com/*', 'https://other.example.org/*'] as OriginPattern[],
        }),
      ],
    });
    await openPopup(PAGE, production, payments, regex);
    await click('Allow');
    expect(fakes().permissions.requests).toEqual([
      ['https://*.example.com/*', 'https://app.example.com/*'],
    ]);
  });

  it('prompts synchronously on Allow, and the notice goes once access is granted', async () => {
    await openPopup(PAGE, production);
    await notice();
    fireEvent.click(screen.getByRole('button', { name: 'Allow' }));
    expect(fakes().permissions.requests).toEqual([['https://*.example.com/*']]);
    await waitFor(() => expect(screen.queryByText(NEEDS_ACCESS)).toBeNull());
  });

  it('shows the notice again when access is revoked', async () => {
    fakes().permissions.grant('https://*.example.com/*');
    await openPopup(PAGE, production);
    await groupList();
    act(() => fakes().permissions.revoke('https://*.example.com/*'));
    expect(await notice()).toBeInTheDocument();
  });

  it('opens the grant page when the popup cannot prompt (D-229)', async () => {
    vi.spyOn(fakes().permissions.api, 'request').mockRejectedValue(new Error('no gesture'));
    await openPopup(PAGE, production);
    await click('Allow');
    const grantPage = grantPageUrl(['https://*.example.com/*' as OriginPattern]);
    await waitFor(async () =>
      expect((await fakeBrowser.tabs.query({})).map((tab) => tab.url)).toContain(grantPage),
    );
  });

  it('keeps a denied Mark this site group in the needs-access state', async () => {
    const { background } = await openPopup(PAGE);
    fakes().permissions.answerNextRequest('deny');
    await click('Mark this site');
    await waitFor(() => expect(background.sent('markThisSite')).toHaveLength(1));
    const added = group('app.example.com', '*://app.example.com:8443/*');
    await background.commit(aState({ revision: 1, siteGroups: [added] }));
    expect(await notice()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Allow' })).toBeEnabled();
  });

  it('has no axe violations', async () => {
    const { view } = await openPopup(PAGE, production);
    await notice();
    expect(await axeViolations(view.container)).toEqual([]);
  });
});

describe('REQ-POP-002 the popup shows whether element marks found their target', () => {
  const deleteButton = anElementMark({ label: 'Delete button' });
  const priceTable = anElementMark({ label: 'Price table' });
  const unlabelled = anElementMark({ target: { kind: 'element', selector: '#totals' } });
  const withElements = group('Production', 'https://*.example.com/*', {
    marks: [deleteButton, priceTable, unlabelled],
  });
  const status = (overrides: Partial<TabStatus> = {}): TabStatus => ({
    marks: [
      { markId: deleteButton.id, found: true },
      { markId: priceTable.id, found: false },
      { markId: unlabelled.id, found: true },
    ],
    favicon: 'off',
    hidden: false,
    ...overrides,
  });

  async function openWithStatus(tabStatus: TabStatusAnswer, ...siteGroups: SiteGroup[]) {
    fakes().permissions.grant('https://*.example.com/*', '*://app.example.com/*');
    const opened = await openPopup(PAGE, ...siteGroups);
    opened.background.tabStatus = tabStatus;
    return opened;
  }

  const markList = (name: string) =>
    shown(() => screen.queryByRole('list', { name: `Element marks of ${name}` }));

  it('lists each element mark of an active group as found or not found', async () => {
    const { background, tabId } = await openWithStatus(status(), withElements);
    const marks = within(await markList('Production')).getAllByRole('listitem');
    expect(marks.map((mark) => mark.textContent)).toEqual([
      'Delete button found',
      'Price table not found Re-pick',
      '#totals found',
    ]);
    expect(background.sent('getTabStatus')).toEqual([{ type: 'getTabStatus', data: { tabId } }]);
  });

  it('shows no mark status for a disabled group', async () => {
    const disabled = { ...withElements, name: 'Disabled one', enabled: false };
    await openWithStatus(status(), disabled);
    await groupList();
    expect(screen.queryByRole('list', { name: 'Element marks of Disabled one' })).toBeNull();
  });

  it('re-picks a mark that was not found, and closes the popup', async () => {
    const close = vi.spyOn(window, 'close').mockImplementation(() => undefined);
    const { background, tabId } = await openWithStatus(status(), withElements);
    await click('Re-pick Price table');
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(background.sent('startPicker')).toEqual([
      { type: 'startPicker', data: { tabId, repickMarkId: priceTable.id } },
    ]);
  });

  it('says when the favicon tint is unavailable', async () => {
    await openWithStatus(status({ favicon: 'unavailable' }), withElements);
    const note = await shown(() => screen.queryByText('Favicon tint unavailable on this page'));
    expect(note).toBeInTheDocument();
  });

  it('shows no status while no marker runs in the tab', async () => {
    await openWithStatus('not-injected', withElements);
    await groupList();
    expect(screen.queryByText(/found/)).toBeNull();
  });

  it('has no axe violations', async () => {
    const { view } = await openWithStatus(status({ favicon: 'unavailable' }), withElements);
    await markList('Production');
    expect(await axeViolations(view.container)).toEqual([]);
  });
});
