import { fireEvent, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SiteGroupId } from '../../core/ids';
import { createPanel, type Panel, type PanelDeps } from './panel';

const LABELS = {
  title: 'Mark this element',
  selector: 'Selector',
  matchOne: 'matches',
  matchNone: 'no match',
  matchInvalid: 'invalid selector',
  matchMany: (count: number) => `${count} matches, the first is marked`,
  siteGroup: 'Site group',
  newSiteGroup: (origin: string) => `New site group for ${origin}`,
  effects: 'Effects',
  effectNames: { ribbon: 'Ribbon', outline: 'Outline', tint: 'Tint', stripes: 'Stripes' },
  color: 'Color',
  colorNames: { red: 'Red', amber: 'Amber', blue: 'Blue', slate: 'Slate' },
  save: 'Save',
  cancel: 'Cancel',
  moreOptions: 'More options…',
};

const PROD = 'grp-prod0001' as SiteGroupId;
const ADMIN = 'grp-admin001' as SiteGroupId;
const GROUPS = [
  { id: PROD, name: 'Production' },
  { id: ADMIN, name: 'Admin' },
];

const panels: Panel[] = [];

afterEach(() => {
  for (const panel of panels.splice(0)) panel.dispose();
  document.body.replaceChildren();
});

/** A panel in a container, with spies; `matches` maps selectors to their match count. */
function aPanel(overrides: Partial<PanelDeps> = {}, matches: Record<string, number> = {}) {
  const deps = {
    selector: '#delete',
    context: { groups: GROUPS, theme: 'system' as const },
    origin: 'prod.example.com',
    labels: LABELS,
    countMatches: (selector: string) =>
      selector.includes('!') ? undefined : (matches[selector] ?? 1),
    onSave: vi.fn(),
    onCancel: vi.fn(),
    onMoreOptions: vi.fn(),
    ...overrides,
  };
  const container = document.createElement('div');
  document.body.append(container);
  const panel = createPanel(container, deps);
  panels.push(panel);
  return { panel, deps, ui: within(panel.element) };
}

type Ui = ReturnType<typeof aPanel>['ui'];

const field = (ui: Ui) => ui.getByRole('textbox', { name: 'Selector' }) as HTMLInputElement;
const typeSelector = (ui: Ui, value: string) => fireEvent.input(field(ui), { target: { value } });
const matchText = (panel: Panel) => panel.element.querySelector('[data-part="match"]')?.textContent;
const chip = (ui: Ui, name: string) => ui.getByRole('button', { name });
const save = (ui: Ui) => ui.getByRole('button', { name: 'Save' }) as HTMLButtonElement;

describe('REQ-PICK-005 the panel shows an editable selector with a live match indicator', () => {
  it('is a labelled dialog with the generated selector', () => {
    const { ui, panel } = aPanel();
    expect(panel.element.getAttribute('role')).toBe('dialog');
    expect(ui.getByRole('heading', { name: 'Mark this element' })).toBeTruthy();
    expect(field(ui).value).toBe('#delete');
    expect(matchText(panel)).toBe('✓ matches');
  });

  it('checks the selector again on every edit', () => {
    const { ui, panel } = aPanel({}, { '.nothing': 0, '.row': 3 });
    typeSelector(ui, '.nothing');
    expect(matchText(panel)).toBe('✕ no match');
    typeSelector(ui, '.row');
    expect(matchText(panel)).toBe('3 matches, the first is marked');
    typeSelector(ui, 'a!b');
    expect(matchText(panel)).toBe('✕ invalid selector');
  });
});

describe('REQ-PICK-005 the panel offers a site group', () => {
  it('lists the active groups first, then a new group for the origin', () => {
    const { ui } = aPanel();
    const select = ui.getByRole('combobox', { name: 'Site group' }) as HTMLSelectElement;
    expect([...select.options].map((option) => option.text)).toEqual([
      'Production',
      'Admin',
      'New site group for prod.example.com',
    ]);
    expect(select.selectedIndex).toBe(0);
  });

  it('offers only the new group when no group is active', () => {
    const { ui } = aPanel({ context: { groups: [], theme: 'system' } });
    const select = ui.getByRole('combobox', { name: 'Site group' }) as HTMLSelectElement;
    expect([...select.options].map((option) => option.text)).toEqual([
      'New site group for prod.example.com',
    ]);
  });
});

describe('REQ-PICK-005 effect chips and color', () => {
  it('offers Ribbon · Outline · Tint · Stripes as toggles, Outline on by default', () => {
    const { ui } = aPanel();
    const chips = within(ui.getByRole('group', { name: 'Effects' })).getAllByRole('button');
    expect(chips.map((button) => button.textContent)).toEqual([
      'Ribbon',
      'Outline',
      'Tint',
      'Stripes',
    ]);
    expect(chips.map((button) => button.getAttribute('aria-pressed'))).toEqual([
      'false',
      'true',
      'false',
      'false',
    ]);
    fireEvent.click(chip(ui, 'Ribbon'));
    expect(chip(ui, 'Ribbon').getAttribute('aria-pressed')).toBe('true');
  });

  it('offers the four color presets, the first one chosen', () => {
    const { ui } = aPanel();
    const radios = within(ui.getByRole('radiogroup', { name: 'Color' })).getAllByRole('radio');
    expect(radios.map((radio) => radio.getAttribute('aria-label'))).toEqual([
      'Red',
      'Amber',
      'Blue',
      'Slate',
    ]);
    expect((radios[0] as HTMLInputElement).checked).toBe(true);
  });
});

describe('REQ-PICK-005 Save sends a savePick intent, Cancel ends the pick', () => {
  it('sends the selector, group, effects and color', () => {
    const { ui, deps } = aPanel();
    typeSelector(ui, '#delete-btn');
    fireEvent.change(ui.getByRole('combobox', { name: 'Site group' }), {
      target: { value: ADMIN },
    });
    fireEvent.click(chip(ui, 'Ribbon'));
    fireEvent.click(ui.getByRole('radio', { name: 'Blue' }));
    fireEvent.click(save(ui));
    expect(deps.onSave).toHaveBeenCalledWith({
      selector: '#delete-btn',
      siteGroupId: ADMIN,
      effects: ['ribbon', 'outline'],
      color: '#1f6feb',
    });
  });

  it('leaves the group out for a new site group', () => {
    const { ui, deps } = aPanel({ context: { groups: [], theme: 'system' } });
    fireEvent.click(save(ui));
    expect(deps.onSave).toHaveBeenCalledWith({
      selector: '#delete',
      effects: ['outline'],
      color: '#c93a2e',
    });
  });

  it('can not save without a match or without an effect', () => {
    const { ui, deps } = aPanel({}, { '.nothing': 0 });
    typeSelector(ui, '.nothing');
    expect(save(ui).disabled).toBe(true);
    typeSelector(ui, '#delete');
    fireEvent.click(chip(ui, 'Outline'));
    expect(save(ui).disabled).toBe(true);
    fireEvent.click(save(ui));
    expect(deps.onSave).not.toHaveBeenCalled();
  });

  it('cancels', () => {
    const { ui, deps } = aPanel();
    fireEvent.click(ui.getByRole('button', { name: 'Cancel' }));
    expect(deps.onCancel).toHaveBeenCalledOnce();
  });

  it('saves and opens the options page from More options…', () => {
    const { ui, deps } = aPanel();
    fireEvent.click(ui.getByRole('button', { name: 'More options…' }));
    expect(deps.onMoreOptions).toHaveBeenCalledWith({
      selector: '#delete',
      siteGroupId: PROD,
      effects: ['outline'],
      color: '#c93a2e',
    });
  });

  it('removes itself when disposed', () => {
    const { panel } = aPanel();
    panel.dispose();
    expect(panel.element.isConnected).toBe(false);
  });
});

describe('REQ-THEME-001 the panel follows the theme setting', () => {
  it.each([
    ['system', null],
    ['light', 'light'],
    ['dark', 'dark'],
  ] as const)('%s → data-theme %s', (theme, attribute) => {
    const { panel } = aPanel({ context: { groups: GROUPS, theme } });
    expect(panel.element.getAttribute('data-theme')).toBe(attribute);
  });
});
