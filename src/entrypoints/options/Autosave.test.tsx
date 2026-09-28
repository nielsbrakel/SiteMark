import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { SiteGroup } from '@/core/model/schema';
import { aPageMark, aSiteGroup, aState } from '@/core/testing/builders';
import { atHash, optionsBackground } from '../../../tests/unit/options-background';
import { byLabel, byRole } from '../../../tests/unit/queries';
import { OptionsApp } from './App';

const tinted = aPageMark({ effects: { tint: { opacityPct: 8 } } });
const prod = aSiteGroup({ name: 'Production', marks: [tinted] });

async function openAt(hash: string, group: SiteGroup = prod) {
  const background = optionsBackground(aState({ siteGroups: [group] }));
  atHash(hash);
  render(<OptionsApp />);
  await screen.findByRole('main');
  return background;
}

const nameField = () => byLabel('Name', byRole('main'));
const saved = () => screen.queryByText('Saved');
/** Autosave waits for a pause in typing; give it time to pass. */
const afterPause = { timeout: 3000 };

function type(control: HTMLElement, ...values: string[]) {
  for (const value of values) fireEvent.change(control, { target: { value } });
}

beforeEach(() => atHash(''));

describe('REQ-OPT-006 changes save themselves, debounced, with a subtle Saved status', () => {
  it('saves the name after a pause in typing, once, without leaving the field', async () => {
    const background = await openAt(`#/groups/${prod.id}`);
    type(nameField(), 'L', 'Li', 'Liv', 'Live');
    expect(background.commands).toEqual([]);
    await waitFor(() => expect(background.commands).toHaveLength(1), afterPause);
    expect(background.commands).toEqual([{ type: 'renameSiteGroup', id: prod.id, name: 'Live' }]);
  });

  it('shows Saved once a change is saved, and not before', async () => {
    await openAt(`#/groups/${prod.id}`);
    expect(saved()).toBeNull();
    type(nameField(), 'Live');
    fireEvent.blur(nameField());
    await waitFor(() => expect(saved()).not.toBeNull());
  });

  it('announces Saved, but not Saving… on every pause in typing (WCAG 4.1.3)', async () => {
    await openAt(`#/groups/${prod.id}`);
    const live = () => byRole('banner').querySelector('[aria-live]');
    type(nameField(), 'Live');
    fireEvent.blur(nameField());
    expect(screen.queryByText('Saving…')).not.toBeNull();
    expect(live()).not.toHaveTextContent('Saving…');
    await waitFor(() => expect(live()).toHaveTextContent('Saved'));
  });

  it('saves a slider once it stops moving', async () => {
    const background = await openAt(`#/groups/${prod.id}/marks/${tinted.id}`);
    const slider = byRole('slider', { name: 'Tint opacity' });
    type(slider, '9', '10', '11');
    expect(slider).toHaveValue('11');
    expect(background.commands).toEqual([]);
    await waitFor(() => expect(background.commands).toHaveLength(1), afterPause);
    expect(background.commands[0]).toMatchObject({
      type: 'updateMark',
      mark: { effects: { tint: { opacityPct: 11 } } },
    });
  });

  it('lets an invalid field block only itself', async () => {
    const background = await openAt(`#/groups/${prod.id}`);
    type(nameField(), 'x'.repeat(41));
    fireEvent.blur(nameField());
    await waitFor(() => expect(nameField()).toHaveAttribute('aria-invalid', 'true'));
    fireEvent.click(byRole('switch', { name: 'Enabled' }));
    await waitFor(() =>
      expect(background.commands.at(-1)).toEqual({
        type: 'setSiteGroupEnabled',
        id: prod.id,
        enabled: false,
      }),
    );
    expect(nameField()).toHaveValue('x'.repeat(41));
  });

  it('never adds a pattern by itself: patterns need Add', async () => {
    const background = await openAt(`#/groups/${prod.id}`);
    type(byLabel('URL pattern'), 'staging.example.com');
    type(nameField(), 'Live');
    await waitFor(() => expect(background.commands).toHaveLength(1), afterPause);
    expect(background.commands).toEqual([{ type: 'renameSiteGroup', id: prod.id, name: 'Live' }]);
  });
});
