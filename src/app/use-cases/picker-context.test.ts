import { describe, expect, it } from 'vitest';
import { emptyState } from '../../core/model/defaults';
import { anElementMark, aSiteGroup, aState, aWildcardPattern } from '../../core/testing/builders';
import { createInMemoryStateRepo } from '../testing/in-memory-state-repo';
import { pickerContext } from './picker-context';

const URL = 'https://prod.example.com/orders';

const prod = aSiteGroup({ name: 'Production', marks: [anElementMark()] });
const admin = aSiteGroup({ name: 'Admin', excludes: [] });
const other = aSiteGroup({
  name: 'Secret test group',
  patterns: [aWildcardPattern({ value: 'https://test.example.com/*' })],
});
const disabled = aSiteGroup({ name: 'Old', enabled: false });
const excluded = aSiteGroup({
  name: 'Not on orders',
  excludes: [aWildcardPattern({ value: 'https://prod.example.com/orders*' })],
});

const repoWith = (state = aState()) =>
  createInMemoryStateRepo({ loaded: { mode: 'normal', state } });

describe('REQ-PICK-005 the panel offers the site groups active on the page', () => {
  it('lists the active groups for the URL by priority, with ID and name only', async () => {
    const state = aState({ siteGroups: [prod, other, disabled, admin, excluded] });
    const context = await pickerContext(repoWith(state), URL);
    expect(context.groups).toEqual([
      { id: prod.id, name: 'Production' },
      { id: admin.id, name: 'Admin' },
    ]);
  });

  it('lists none on a page no group covers (the panel then offers a new group)', async () => {
    const context = await pickerContext(repoWith(aState({ siteGroups: [other] })), URL);
    expect(context.groups).toEqual([]);
  });

  it('lists none while the stored data is read-only', async () => {
    const repo = createInMemoryStateRepo({
      loaded: { mode: 'readOnly', state: emptyState(), schemaVersion: 99 },
    });
    expect(await pickerContext(repo, URL)).toEqual({ groups: [], theme: 'system' });
  });
});

describe('REQ-THEME-001 the panel follows the theme setting', () => {
  it.each(['system', 'light', 'dark'] as const)('passes the %s theme', async (theme) => {
    const context = await pickerContext(repoWith(aState({ settings: { theme } })), URL);
    expect(context.theme).toBe(theme);
  });
});
