import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import type { Hex } from '@/core/model/schema';
import { aPageMark, aSiteGroup, aState, aWildcardPattern } from '@/core/testing/builders';
import { axeViolations } from '../../../tests/unit/axe';
import { activeTab, fakeBackground } from '../../../tests/unit/popup-harness';
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
