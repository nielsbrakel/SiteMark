import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SiteGroup } from '@/core/model/schema';
import { aPageMark, aSiteGroup, aState, aWildcardPattern } from '@/core/testing/builders';
import { fakes } from '../../../tests/fakes/install';
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

describe('REQ-GRP-003 REQ-GRP-002 turn a site group on or off in the options page', () => {
  const testGroup = aSiteGroup({
    name: 'Test',
    enabled: false,
    patterns: [aWildcardPattern({ value: '*://test.example.com/*' })],
  });
  const enabled = () => byRole('switch', { name: 'Enabled' }, pane());
  const openGroup = (group: SiteGroup) =>
    openAt(`#/groups/${group.id}`, [prod, staging, testGroup]);

  it('shows whether the site group is on, in the editor and in the list', async () => {
    await openGroup(prod);
    expect(enabled()).toHaveAttribute('aria-checked', 'true');
    const rows = within(sidebar()).getAllByRole('listitem');
    expect(rows.map((row) => within(row).queryByText(/^(On|Off)$/)?.textContent)).toEqual([
      'On',
      'Off',
      'Off',
    ]);
  });

  it('turns a site group off', async () => {
    const { background } = await openGroup(prod);
    fireEvent.click(enabled());
    await waitFor(() => expect(enabled()).toHaveAttribute('aria-checked', 'false'));
    expect(background.commands).toEqual([
      { type: 'setSiteGroupEnabled', id: prod.id, enabled: false },
    ]);
    expect(fakes().permissions.requests).toEqual([]);
  });

  it("asks for the group's sites first and synchronously when turning it on (D-229)", async () => {
    const { background } = await openGroup(testGroup);
    fireEvent.click(enabled());
    expect(fakes().permissions.requests).toEqual([['*://test.example.com/*']]);
    await waitFor(() => expect(enabled()).toHaveAttribute('aria-checked', 'true'));
    expect(background.commands).toEqual([
      { type: 'setSiteGroupEnabled', id: testGroup.id, enabled: true },
    ]);
  });

  it('turns it on even when the user declines the prompt', async () => {
    fakes().permissions.answerNextRequest('deny');
    await openGroup(testGroup);
    fireEvent.click(enabled());
    await waitFor(() => expect(enabled()).toHaveAttribute('aria-checked', 'true'));
  });

  it('cannot turn on a site group without URL patterns, and says why', async () => {
    await openGroup(staging);
    expect(enabled()).toBeDisabled();
    expect(enabled()).toHaveAccessibleDescription(
      'Add a URL pattern before you turn on this site group.',
    );
  });

  it('says so when the change is refused', async () => {
    const { background } = await openGroup(prod);
    background.refuseNext('siteGroupNotFound');
    fireEvent.click(enabled());
    expect(await findRole('status')).toHaveTextContent('This site group no longer exists.');
  });
});

describe('REQ-GRP-004 REQ-A11Y-010 reorder site groups with Move up/down or drag and drop', () => {
  const local = aSiteGroup({ name: 'Local', enabled: false, patterns: [] });
  const openList = () => openAt(`#/groups/${prod.id}`, [prod, staging, local]);
  const move = (name: string, direction: 'up' | 'down') =>
    byRole('button', { name: `Move “${name}” ${direction}` }, sidebar());
  const row = (name: string) =>
    within(sidebar())
      .getAllByRole('listitem')
      .find((item) => within(item).queryByRole('link', { name })) as HTMLElement;

  it('has Move up and Move down for every site group, disabled at the ends', async () => {
    await openList();
    expect(move('Production', 'up')).toBeDisabled();
    expect(move('Production', 'down')).toBeEnabled();
    expect(move('Staging', 'up')).toBeEnabled();
    expect(move('Local', 'down')).toBeDisabled();
  });

  it('moves a site group down one place and keeps focus on the button', async () => {
    const { background } = await openList();
    move('Production', 'down').focus();
    fireEvent.click(move('Production', 'down'));
    await waitFor(() => expect(groupNames()).toEqual(['Staging', 'Production', 'Local']));
    expect(background.commands).toEqual([{ type: 'moveSiteGroup', id: prod.id, toIndex: 1 }]);
    await waitFor(() => expect(move('Production', 'down')).toHaveFocus());
  });

  it('moves focus to the other button when the group reaches an end', async () => {
    const { background } = await openList();
    move('Staging', 'up').focus();
    fireEvent.click(move('Staging', 'up'));
    await waitFor(() => expect(groupNames()).toEqual(['Staging', 'Production', 'Local']));
    expect(background.commands).toEqual([{ type: 'moveSiteGroup', id: staging.id, toIndex: 0 }]);
    await waitFor(() => expect(move('Staging', 'down')).toHaveFocus());
  });

  it('moves a site group to the row it is dropped on', async () => {
    const { background } = await openList();
    byRole('link', { name: 'Local' }, sidebar());
    expect(row('Local')).toHaveAttribute('draggable', 'true');
    fireEvent.dragStart(row('Local'));
    fireEvent.dragOver(row('Production'));
    fireEvent.drop(row('Production'));
    await waitFor(() => expect(groupNames()).toEqual(['Local', 'Production', 'Staging']));
    expect(background.commands).toEqual([{ type: 'moveSiteGroup', id: local.id, toIndex: 0 }]);
  });

  it('ignores a drop that did not start in the list', async () => {
    const { background } = await openList();
    byRole('link', { name: 'Local' }, sidebar());
    fireEvent.drop(row('Production'));
    expect(background.commands).toEqual([]);
  });
});

describe('REQ-GRP-006 duplicate a site group', () => {
  const duplicate = () => byRole('button', { name: 'Duplicate site group' }, pane());

  it('adds a disabled copy named "<name> copy" at the bottom and opens it', async () => {
    const { background } = await openAt(`#/groups/${prod.id}`);
    fireEvent.click(duplicate());
    await waitFor(() => expect(groupNames()).toEqual(['Production', 'Staging', 'Production copy']));
    expect(background.commands).toEqual([{ type: 'duplicateSiteGroup', id: prod.id }]);
    await waitFor(() => expect(paneTitle()).toBe('Production copy'));
    expect(byRole('switch', { name: 'Enabled' }, pane())).toHaveAttribute('aria-checked', 'false');
    const copy = background.state().siteGroups.at(-1);
    expect(copy?.patterns.map((pattern) => pattern.value)).toEqual(['https://prod.example.com/*']);
    expect(copy?.id).not.toBe(prod.id);
  });

  it('says so when the copy is refused', async () => {
    const { background } = await openAt(`#/groups/${prod.id}`);
    background.refuseNext('siteGroupLimitReached');
    fireEvent.click(duplicate());
    expect(await findRole('status')).toHaveTextContent('You can have at most 200 site groups.');
    expect(groupNames()).toEqual(['Production', 'Staging']);
  });
});
