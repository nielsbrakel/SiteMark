import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SiteGroup } from '@/core/model/schema';
import { aPageMark, aSiteGroup, aState } from '@/core/testing/builders';
import { axeViolations } from '../../../tests/unit/axe';
import { atHash, optionsBackground } from '../../../tests/unit/options-background';
import { byLabel, byRole, findRole } from '../../../tests/unit/queries';
import { OptionsApp } from './App';

const prod = aSiteGroup({ name: 'Production', marks: [aPageMark()] });
const staging = aSiteGroup({ name: 'Staging', enabled: false, patterns: [] });

async function openAt(hash: string, siteGroups: SiteGroup[] = [prod, staging]) {
  const background = optionsBackground(aState({ siteGroups }));
  atHash(hash);
  const view = render(<OptionsApp />);
  await screen.findByRole('main');
  return { background, container: view.container };
}

const sidebar = () => byRole('complementary', { name: 'Site groups' });
const groupNames = () =>
  within(sidebar())
    .getAllByRole('link')
    .map((link) => link.textContent);
const pane = () => byRole('main');
const paneTitle = () => within(pane()).getByRole('heading', { level: 2 }).textContent;

function type(control: HTMLElement, value: string) {
  fireEvent.change(control, { target: { value } });
}

beforeEach(() => atHash(''));

describe('REQ-GRP-001 add a site group at the bottom of the list', () => {
  const addButton = () => byRole('button', { name: 'Add site group' }, sidebar());

  it('adds the site group at the bottom and opens it', async () => {
    const { background } = await openAt('#/');
    type(byLabel('New site group', sidebar()), 'Local');
    fireEvent.click(addButton());
    await waitFor(() => expect(groupNames()).toEqual(['Production', 'Staging', 'Local']));
    expect(background.commands).toEqual([{ type: 'createSiteGroup', name: 'Local' }]);
    await waitFor(() => expect(paneTitle()).toBe('Local'));
    expect(byLabel('New site group', sidebar())).toHaveValue('');
  });

  it('shows why a name is refused, next to the field', async () => {
    await openAt('#/');
    type(byLabel('New site group', sidebar()), '   ');
    fireEvent.click(addButton());
    const input = byLabel('New site group', sidebar());
    await waitFor(() =>
      expect(input).toHaveAccessibleDescription('Enter a name of 1 to 40 characters.'),
    );
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(groupNames()).toEqual(['Production', 'Staging']);
  });
});

describe('REQ-GRP-001 rename a site group', () => {
  const nameField = () => byLabel('Name', pane());

  it('renames the site group when the name field loses focus', async () => {
    const { background } = await openAt(`#/groups/${prod.id}`);
    expect(nameField()).toHaveValue('Production');
    type(nameField(), 'Live');
    fireEvent.blur(nameField());
    await waitFor(() => expect(groupNames()).toEqual(['Live', 'Staging']));
    expect(background.commands).toEqual([{ type: 'renameSiteGroup', id: prod.id, name: 'Live' }]);
    expect(paneTitle()).toBe('Live');
  });

  it('sends nothing when the name did not change', async () => {
    const { background } = await openAt(`#/groups/${prod.id}`);
    fireEvent.blur(nameField());
    expect(background.commands).toEqual([]);
  });

  it('keeps the typed name and shows why it is refused', async () => {
    await openAt(`#/groups/${prod.id}`);
    type(nameField(), 'x'.repeat(41));
    fireEvent.blur(nameField());
    await waitFor(() =>
      expect(nameField()).toHaveAccessibleDescription('Enter a name of 1 to 40 characters.'),
    );
    expect(nameField()).toHaveValue('x'.repeat(41));
    expect(groupNames()).toEqual(['Production', 'Staging']);
  });
});

describe('REQ-GRP-001 delete a site group, with confirmation and 10 s undo', () => {
  const deleteButton = () => byRole('button', { name: 'Delete site group' }, pane());
  const dialog = () => byRole('dialog', { name: 'Delete “Production”?' });

  async function deleteProduction() {
    const opened = await openAt(`#/groups/${prod.id}`);
    fireEvent.click(deleteButton());
    fireEvent.click(byRole('button', { name: 'Delete' }, dialog()));
    await waitFor(() => expect(groupNames()).toEqual(['Staging']));
    return opened;
  }

  it('asks for confirmation first, and Cancel keeps the site group', async () => {
    const { background } = await openAt(`#/groups/${prod.id}`);
    fireEvent.click(deleteButton());
    expect(dialog()).toHaveTextContent('Its URL patterns and marks are deleted too.');
    fireEvent.click(byRole('button', { name: 'Cancel' }, dialog()));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(background.commands).toEqual([]);
    expect(groupNames()).toEqual(['Production', 'Staging']);
  });

  it('deletes after confirmation and opens another site group', async () => {
    const { background } = await deleteProduction();
    expect(background.commands).toEqual([{ type: 'deleteSiteGroup', id: prod.id }]);
    expect(paneTitle()).toBe('Staging');
  });

  it('offers Undo, which puts the site group back where it was', async () => {
    const { background } = await deleteProduction();
    const status = await findRole('status');
    expect(status).toHaveTextContent('Deleted “Production”.');
    fireEvent.click(byRole('button', { name: 'Undo' }, status));
    await waitFor(() => expect(groupNames()).toEqual(['Production', 'Staging']));
    expect(background.commands.at(-1)).toEqual({ type: 'restoreSiteGroup', group: prod, index: 0 });
  });

  it('keeps Undo for 10 seconds', async () => {
    const timers = vi.spyOn(globalThis, 'setTimeout');
    await deleteProduction();
    await findRole('button', { name: 'Undo' });
    const [dismiss] = timers.mock.calls.findLast(([, ms]) => ms === 10_000) ?? [];
    expect(dismiss).toBeTypeOf('function');
    act(() => (dismiss as () => void)());
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
  });
});

describe('REQ-GRP-001 the site group list and editor are accessible', () => {
  it('has no axe violations', async () => {
    const { container } = await openAt(`#/groups/${prod.id}`);
    byLabel('Name', pane());
    expect(await axeViolations(container)).toEqual([]);
  });
});
