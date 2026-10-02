import { act, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { aPageMark, aSiteGroup, aState } from '@/core/testing/builders';
import { createFakeCommands } from '../../../tests/fakes/commands';
import { axeViolations } from '../../../tests/unit/axe';
import { atHash, optionsBackground } from '../../../tests/unit/options-background';
import { OptionsApp } from './App';

const mark = aPageMark();
const prod = aSiteGroup({ name: 'Production', marks: [mark] });
const staging = aSiteGroup({ name: 'Staging', enabled: false, patterns: [] });

async function openAt(hash: string, siteGroups = [prod, staging]) {
  optionsBackground(aState({ siteGroups }));
  atHash(hash);
  const view = render(<OptionsApp />);
  await screen.findByRole('main');
  return view;
}

const sidebar = () => screen.getByRole('complementary', { name: 'Site groups' });
const pages = () => screen.getByRole('navigation', { name: 'Pages' });
const paneHeading = () => within(screen.getByRole('main')).getByRole('heading', { level: 2 });

function navigate(hash: string) {
  act(() => {
    atHash(hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

function withShortcut(shortcut: string) {
  const commands = createFakeCommands([{ name: 'start-picker', shortcut }]);
  Object.defineProperty(fakeBrowser, 'commands', { value: commands.api, configurable: true });
}

beforeEach(() => atHash(''));

describe('REQ-OPT-001 options layout: a site group list and an editor pane', () => {
  it('lists the site groups in a sidebar, in priority order', async () => {
    await openAt('#/');
    const links = within(sidebar()).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Production', 'Staging']);
    expect(links[1]).toHaveAttribute('href', `#/groups/${staging.id}`);
  });

  it('opens the first site group when there is no route', async () => {
    await openAt('');
    expect(paneHeading()).toHaveTextContent('Production');
    expect(within(sidebar()).getByRole('link', { name: 'Production' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('says how to start when there are no site groups', async () => {
    await openAt('', []);
    expect(screen.getByRole('main')).toHaveTextContent(
      'No site groups yet. Add one to start marking sites.',
    );
  });

  it('shows a loading status until the state arrives', () => {
    render(<OptionsApp />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
  });

  it("says so when the state can't be read", async () => {
    fakeBrowser.runtime.onMessage.addListener((_message, _sender, sendResponse) => {
      sendResponse({ ok: false, error: 'handlerFailed' });
      return true;
    });
    render(<OptionsApp />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "SiteMark can't show its settings right now. Reload this page to try again.",
    );
  });

  it('has no axe violations', async () => {
    const { container } = await openAt('#/');
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('REQ-OPT-001 hash routing for deep links', () => {
  it('opens a site group from #/groups/:id', async () => {
    await openAt(`#/groups/${staging.id}`);
    expect(paneHeading()).toHaveTextContent('Staging');
    expect(within(sidebar()).getByRole('link', { name: 'Staging' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it("opens a mark's site group from #/groups/:id/marks/:markId", async () => {
    await openAt(`#/groups/${prod.id}/marks/${mark.id}`);
    expect(paneHeading()).toHaveTextContent('Production');
  });

  it('opens the first site group for a group that no longer exists', async () => {
    await openAt('#/groups/grp-missing0');
    expect(paneHeading()).toHaveTextContent('Production');
  });

  it.each([
    ['#/settings', 'Settings'],
    ['#/data', 'Data'],
  ])('opens %s and marks it in the page navigation', async (hash, page) => {
    await openAt(hash);
    expect(paneHeading()).toHaveTextContent(page);
    expect(within(pages()).getByRole('link', { name: page })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('links the pages from the navigation', async () => {
    await openAt('#/');
    const links = within(pages()).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Site groups', '#/'],
      ['Settings', '#/settings'],
      ['Data', '#/data'],
    ]);
    expect(links[0]).toHaveAttribute('aria-current', 'page');
  });

  it('follows the hash as it changes', async () => {
    await openAt('#/');
    navigate('#/data');
    expect(paneHeading()).toHaveTextContent('Data');
    navigate(`#/groups/${staging.id}`);
    expect(paneHeading()).toHaveTextContent('Staging');
  });
});

describe('REQ-OPT-001 the tab title names the open page (WCAG 2.4.2)', () => {
  it.each([
    [`#/groups/${staging.id}`, 'Staging – SiteMark'],
    [`#/groups/${prod.id}/marks/${mark.id}`, 'Production – SiteMark'],
    ['#/settings', 'Settings – SiteMark'],
    ['#/data', 'Data – SiteMark'],
    ['#/welcome', 'Welcome to SiteMark – SiteMark'],
  ])('titles %s "%s"', async (hash, title) => {
    await openAt(hash);
    expect(document.title).toBe(title);
  });

  it('names the site group list when there are no site groups', async () => {
    await openAt('', []);
    expect(document.title).toBe('Site groups – SiteMark');
  });

  it('follows the hash as it changes', async () => {
    await openAt('#/');
    expect(document.title).toBe('Production – SiteMark');
    navigate('#/data');
    expect(document.title).toBe('Data – SiteMark');
  });
});

describe('REQ-OPT-001 the welcome tab (opened on install)', () => {
  it('shows three steps and the pin hint', async () => {
    await openAt('#/welcome');
    expect(paneHeading()).toHaveTextContent('Welcome to SiteMark');
    const steps = within(screen.getByRole('list', { name: 'Get started' })).getAllByRole(
      'listitem',
    );
    expect(steps.map((step) => step.textContent)).toEqual([
      'Open a site you want to mark.',
      'Click the SiteMark icon and choose Mark this site.',
      'Allow SiteMark on that site when your browser asks.',
    ]);
    expect(screen.getByRole('main')).toHaveTextContent(
      'Pin SiteMark: open the puzzle-piece menu in the toolbar and click the pin next to SiteMark.',
    );
  });

  it('shows the actual shortcut for picking an element', async () => {
    withShortcut('Alt+Shift+M');
    await openAt('#/welcome');
    expect(
      await screen.findByText('Press Alt+Shift+M on any page to pick an element to mark.'),
    ).toBeInTheDocument();
  });

  it('says when picking has no shortcut', async () => {
    withShortcut('');
    await openAt('#/welcome');
    expect(
      await screen.findByText(
        "Picking an element has no keyboard shortcut yet. You can set one in your browser's shortcut settings.",
      ),
    ).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = await openAt('#/welcome');
    expect(await axeViolations(container)).toEqual([]);
  });
});
