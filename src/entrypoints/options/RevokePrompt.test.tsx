import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SiteGroup } from '@/core/model/schema';
import { aSiteGroup, aState, aWildcardPattern } from '@/core/testing/builders';
import { fakes } from '../../../tests/fakes/install';
import { atHash, optionsBackground } from '../../../tests/unit/options-background';
import { byRole, findRole } from '../../../tests/unit/queries';
import { OptionsApp } from './App';

const PROD = 'https://prod.example.com/*';
const TEST = 'https://test.example.com/*';
const prodPattern = aWildcardPattern({ value: PROD });
const testPattern = aWildcardPattern({ value: TEST });
const prod = aSiteGroup({ name: 'Production', patterns: [prodPattern, testPattern] });
const other = aSiteGroup({ name: 'Other', patterns: [aWildcardPattern({ value: TEST })] });

async function openGroup(group: SiteGroup, siteGroups: SiteGroup[] = [group]) {
  const background = optionsBackground(aState({ siteGroups }));
  atHash(`#/groups/${group.id}`);
  render(<OptionsApp />);
  await screen.findByRole('main');
  return background;
}

const removePattern = (value: string) =>
  fireEvent.click(
    byRole('button', { name: `Remove “${value}”` }, byRole('list', { name: 'URL patterns' })),
  );
const prompt = () => screen.queryByText(/can still access/);

beforeEach(() => atHash(''));

describe('REQ-PRIV-004 offer to revoke origins nothing uses any more', () => {
  it('offers it after a pattern is removed, and removes the access on request', async () => {
    fakes().permissions.grant(PROD, TEST);
    await openGroup(prod);
    removePattern(PROD);
    const status = await findRole('status');
    await waitFor(() =>
      expect(status).toHaveTextContent('SiteMark can still access 1 site that no site group uses.'),
    );
    fireEvent.click(byRole('button', { name: 'Remove access' }, status));
    await waitFor(() => expect(fakes().permissions.granted).toEqual([TEST]));
  });

  it('does not offer origins another pattern still uses', async () => {
    fakes().permissions.grant(PROD, TEST);
    const background = await openGroup(prod, [prod, other]);
    removePattern(TEST);
    await waitFor(() => expect(background.commands).toHaveLength(1));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(prompt()).toBeNull();
  });

  it('does not offer origins that were never granted', async () => {
    const background = await openGroup(prod);
    removePattern(PROD);
    await waitFor(() => expect(background.commands).toHaveLength(1));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(prompt()).toBeNull();
  });

  it('offers it after a deleted site group’s undo window has passed', async () => {
    fakes().permissions.grant(PROD, TEST);
    const timers = vi.spyOn(globalThis, 'setTimeout');
    await openGroup(prod, [prod, other]);
    fireEvent.click(byRole('button', { name: 'Delete site group' }));
    fireEvent.click(byRole('button', { name: 'Delete' }, byRole('dialog')));
    await findRole('button', { name: 'Undo' });
    expect(prompt()).toBeNull();
    const [endOfUndo] = timers.mock.calls.findLast(([, ms]) => ms === 10_000) ?? [];
    act(() => (endOfUndo as () => void)());
    await waitFor(() =>
      expect(byRole('status')).toHaveTextContent(
        'SiteMark can still access 1 site that no site group uses.',
      ),
    );
    expect(within(byRole('status')).getByRole('button', { name: 'Remove access' })).toBeEnabled();
  });

  it('offers nothing when the delete is undone', async () => {
    fakes().permissions.grant(PROD, TEST);
    await openGroup(prod, [prod, other]);
    fireEvent.click(byRole('button', { name: 'Delete site group' }));
    fireEvent.click(byRole('button', { name: 'Delete' }, byRole('dialog')));
    fireEvent.click(await findRole('button', { name: 'Undo' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull());
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(prompt()).toBeNull();
  });
});
