import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import type { Theme } from '@/core/model/schema';
import {
  anElementMark,
  aPageMark,
  aSiteGroup,
  aState,
  aWildcardPattern,
} from '@/core/testing/builders';
import { createFakeCommands } from '../../../tests/fakes/commands';
import { fakes } from '../../../tests/fakes/install';
import { axeViolations } from '../../../tests/unit/axe';
import { atHash, optionsBackground } from '../../../tests/unit/options-background';
import { byLabel, byRole, findRole } from '../../../tests/unit/queries';
import { OptionsApp } from './App';

async function openSettings(theme: Theme = 'system') {
  const background = optionsBackground(aState({ siteGroups: [], settings: { theme } }));
  atHash('#/settings');
  const view = render(<OptionsApp />);
  await screen.findByRole('main');
  return { background, container: view.container };
}

function withCommands(...commands: { name: string; shortcut: string }[]) {
  const fake = createFakeCommands(commands);
  Object.defineProperty(fakeBrowser, 'commands', { value: fake.api, configurable: true });
}

const themeChoice = (name: 'System' | 'Light' | 'Dark') =>
  byRole('radio', { name }, byRole('radiogroup', { name: 'Theme' }));

beforeEach(() => atHash(''));

describe('REQ-OPT-004 REQ-THEME-001 the theme setting', () => {
  it('shows the stored theme and applies it to the page', async () => {
    await openSettings('dark');
    expect(themeChoice('Dark')).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('saves a new theme and applies it', async () => {
    const { background } = await openSettings('dark');
    fireEvent.click(themeChoice('Light'));
    await waitFor(() => expect(themeChoice('Light')).toHaveAttribute('aria-checked', 'true'));
    expect(background.commands).toEqual([{ type: 'setTheme', theme: 'light' }]);
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });
});

describe('REQ-I18N-006 the language setting', () => {
  const languageChoice = (name: string) =>
    byRole('radio', { name }, byRole('radiogroup', { name: 'Language' }));
  const reload = () => vi.spyOn(window.location, 'reload').mockImplementation(() => undefined);

  it('shows the browser language by default', async () => {
    await openSettings();
    expect(languageChoice('Browser language')).toHaveAttribute('aria-checked', 'true');
  });

  it('saves a new language and reloads the page to apply it', async () => {
    const reloaded = reload();
    const { background } = await openSettings();
    fireEvent.click(languageChoice('Nederlands'));
    await waitFor(() => expect(reloaded).toHaveBeenCalledOnce());
    expect(background.commands).toEqual([{ type: 'setLanguage', language: 'nl' }]);
  });
});

describe('REQ-OPT-004 REQ-CMD-001 REQ-CMD-002 keyboard shortcuts', () => {
  const shortcuts = () => byRole('list', { name: 'Keyboard shortcuts' });

  it('lists the live shortcuts, and says when one is not assigned', async () => {
    withCommands(
      { name: 'start-picker', shortcut: 'Alt+Shift+M' },
      { name: 'toggle-hide', shortcut: '' },
    );
    await openSettings();
    const list = await findRole('list', { name: 'Keyboard shortcuts' });
    await waitFor(() => expect(within(list).getAllByRole('listitem')).toHaveLength(2));
    const rows = within(shortcuts()).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Pick an element to mark on this page');
    expect(rows[0]).toHaveTextContent('Alt+Shift+M');
    expect(rows[1]).toHaveTextContent('Show or hide the marks on this tab');
    expect(rows[1]).toHaveTextContent('Not assigned');
  });

  it("opens the browser's shortcut settings", async () => {
    withCommands({ name: 'start-picker', shortcut: 'Alt+Shift+M' });
    const create = vi.spyOn(fakeBrowser.tabs, 'create');
    await openSettings();
    fireEvent.click(byRole('button', { name: 'Change shortcuts' }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({ url: 'chrome://extensions/shortcuts' }),
    );
  });

  const elsewhere =
    "This browser can't open its shortcut settings from here. Look for keyboard shortcuts in the browser's own extension settings.";

  it('explains where shortcuts change when the browser has no page for it (Safari)', async () => {
    withCommands({ name: 'start-picker', shortcut: 'Alt+Shift+M' });
    vi.spyOn(fakeBrowser.runtime, 'getURL').mockImplementation(
      (path) => `safari-web-extension://abc${String(path)}`,
    );
    await openSettings();
    await findRole('list', { name: 'Keyboard shortcuts' });
    expect(screen.queryByRole('button', { name: 'Change shortcuts' })).toBeNull();
    expect(byRole('main')).toHaveTextContent(elsewhere);
  });

  it('explains it too when the shortcut settings fail to open', async () => {
    withCommands({ name: 'start-picker', shortcut: 'Alt+Shift+M' });
    vi.spyOn(fakeBrowser.tabs, 'create').mockRejectedValue(new Error('Illegal URL'));
    await openSettings();
    fireEvent.click(byRole('button', { name: 'Change shortcuts' }));
    await waitFor(() => expect(byRole('main')).toHaveTextContent(elsewhere));
  });
});

describe('REQ-OPT-004 help about the title prefix and browser history', () => {
  it('explains that a title prefix also shows in the history', async () => {
    await openSettings();
    expect(byRole('main')).toHaveTextContent(
      'Browsers keep page titles in their history, so a title prefix shows up there too.',
    );
  });

  it('has no axe violations', async () => {
    withCommands({ name: 'start-picker', shortcut: 'Alt+Shift+M' });
    const { container } = await openSettings();
    byRole('radiogroup', { name: 'Theme' });
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('REQ-OPT-007 copy diagnostics to the local clipboard', () => {
  const groups = [
    aSiteGroup({
      name: 'Secret intranet',
      patterns: [aWildcardPattern({ value: 'https://prod.example.com/admin/*' })],
      marks: [aPageMark(), anElementMark({ target: { kind: 'element', selector: '#secret' } })],
    }),
    aSiteGroup({
      name: 'Test',
      enabled: false,
      patterns: [aWildcardPattern({ value: 'https://test.example.com/*' })],
      marks: [],
    }),
  ];

  function stubClipboard() {
    const writeText = vi.fn(async (_text: string) => undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    return writeText;
  }

  async function openDiagnostics(): Promise<HTMLElement> {
    optionsBackground(aState({ siteGroups: groups }));
    atHash('#/settings');
    render(<OptionsApp />);
    await screen.findByRole('main');
    return byRole('region', { name: 'Diagnostics' });
  }

  const groupsWithWildcard = [
    ...groups,
    aSiteGroup({ patterns: [aWildcardPattern({ value: '*.intranet.example.com' })] }),
  ];

  async function copied(includeOrigins = false): Promise<string> {
    vi.spyOn(fakeBrowser.runtime, 'getManifest').mockReturnValue({
      manifest_version: 3,
      name: 'SiteMark',
      version: '1.2.3',
    });
    fakes().permissions.grant('https://prod.example.com/*');
    const writeText = stubClipboard();
    optionsBackground(aState({ siteGroups: groupsWithWildcard }));
    atHash('#/settings');
    render(<OptionsApp />);
    await screen.findByRole('main');
    const include = byLabel('Include site addresses (origins)');
    expect(include).not.toBeChecked();
    if (includeOrigins) fireEvent.click(include);
    fireEvent.click(byRole('button', { name: 'Copy diagnostics' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    return writeText.mock.calls[0]?.[0] ?? '';
  }

  it('copies the version, browser, grant counts and marks, without any address, name or selector', async () => {
    const text = await copied();
    expect(text).toContain('SiteMark 1.2.3');
    expect(text).toContain(`Browser: ${navigator.userAgent}`);
    expect(text).toContain('Site groups: 3 (2 on)');
    expect(text).toContain('Marks: 2 (1 page, 1 element)');
    expect(text).toContain('Origins: 3 (1 granted, 2 not granted)');
    expect(text).toContain('- https, exact host: granted');
    expect(text).toContain('- https, exact host: not granted');
    expect(text).toContain('- any scheme, host and subdomains: not granted');
    for (const secret of ['example.com', 'Secret intranet', '/admin/', '#secret']) {
      expect(text).not.toContain(secret);
    }
    expect(await findRole('status', {}, byRole('main'))).toHaveTextContent(
      'Diagnostics copied to the clipboard.',
    );
  });

  it('includes the origins only when the user ticks the box', async () => {
    const text = await copied(true);
    expect(text).toContain('Origins: 3 (1 granted, 2 not granted)');
    expect(text).toContain('- https://prod.example.com/* granted');
    expect(text).toContain('- https://test.example.com/* not granted');
    expect(text).toContain('- *://*.intranet.example.com/* not granted');
    expect(text).not.toContain('Secret intranet');
    expect(text).not.toContain('/admin/');
  });

  it('says honestly what it copies', async () => {
    expect(await openDiagnostics()).toHaveTextContent(
      'Copies technical details for a bug report: versions, counts and whether site access is granted. Names, URL patterns and selectors are never included, and site addresses only if you tick the box.',
    );
  });
});
