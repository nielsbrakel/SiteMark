import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import type { Hex } from '@/core/model/schema';
import { err } from '@/core/result';
import { aPageMark, aSiteGroup, aState, aWildcardPattern } from '@/core/testing/builders';
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
const items = async () => within(await groupList()).getAllByRole('listitem');
const chipColor = (item: HTMLElement) =>
  item
    .querySelector<HTMLElement>('[aria-hidden="true"]')
    ?.style.getPropertyValue('--sm-chip-color');

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
  const markThisSite = async () => {
    const button = await shown(() => screen.queryByRole('button', { name: 'Mark this site' }));
    fireEvent.click(button);
  };

  it('requests the host synchronously in the click, then sends markThisSite for the tab', async () => {
    const { background, tabId } = await openPopup(PAGE, elsewhere);
    await markThisSite();
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
    await markThisSite();
    await waitFor(() => expect(background.sent('markThisSite')).toHaveLength(1));
    const added = group('app.example.com', '*://app.example.com:8443/*');
    await background.commit(aState({ revision: 1, siteGroups: [elsewhere, added] }));
    const [item] = await items();
    expect(item).toHaveTextContent('app.example.com');
  });

  it('explains why when the background refuses', async () => {
    const { background } = await openPopup(PAGE, elsewhere);
    background.markThisSite = () => err('siteGroupLimitReached');
    await markThisSite();
    const alert = await shown(() => screen.queryByRole('alert'));
    expect(alert).toHaveTextContent('You can have at most 200 site groups.');
  });

  it('says so when the background does not answer', async () => {
    await openPopup(PAGE, elsewhere);
    await shown(() => screen.queryByRole('button', { name: 'Mark this site' }));
    fakeBrowser.runtime.onMessage.removeAllListeners();
    await markThisSite();
    const alert = await shown(() => screen.queryByRole('alert'));
    expect(alert).toHaveTextContent("SiteMark didn't respond. Close this popup and try again.");
  });
});
