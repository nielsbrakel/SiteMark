import { fireEvent, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MarkId, SiteGroupId } from '../../core/ids';
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
  movePanel: 'Move panel',
  notGranted: 'Shown on this tab only. Allow SiteMark on this site to keep it.',
  allow: 'Allow',
  close: 'Close',
  repickTitle: 'Choose the element again',
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

type Box = { left: number; top: number; width: number; height: number };
type Env = {
  /** What the panel's trust check says about every event (default: trusted). */
  trusted?: boolean;
  /** Leave the clock at the moment the panel appeared (default: 1 s later, past the delay). */
  fresh?: boolean;
  /** The selected element's box (default: top left of the 1024 × 768 viewport). */
  selection?: Box;
};

/**
 * A panel in a container, with spies; `matches` maps selectors to their match count. happy-dom
 * events are never trusted, so the trust check is replaced unless `env.trusted` is false.
 */
function aPanel(
  overrides: Partial<PanelDeps> = {},
  matches: Record<string, number> = {},
  env: Env = {},
) {
  const clock = { time: 0 };
  const deps = {
    selection: env.selection ?? { left: 10, top: 10, width: 100, height: 40 },
    isTrusted: (_event: Event) => env.trusted ?? true,
    now: () => clock.time,
    selector: '#delete',
    context: { groups: GROUPS, theme: 'system' as const },
    origin: 'prod.example.com',
    labels: LABELS,
    countMatches: (selector: string) =>
      selector.includes('!') ? undefined : (matches[selector] ?? 1),
    onSave: vi.fn(),
    onCancel: vi.fn(),
    onMoreOptions: vi.fn(),
    onAllow: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const container = document.createElement('div');
  document.body.append(container);
  const panel = createPanel(container, deps);
  panels.push(panel);
  if (!env.fresh) clock.time = 1000;
  return { panel, deps, clock, ui: within(panel.element) };
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

// ── Placement, Move and trust (T-108) ─────────────────────────────────────────────────────────

const corner = (panel: Panel) => panel.element.getAttribute('data-corner');
const moveButton = (ui: Ui) => ui.queryByRole('button', { name: 'Move panel' });

describe('REQ-A11Y-010 the panel sits opposite the selection and can be moved without dragging', () => {
  it.each([
    [{ left: 10, top: 10, width: 100, height: 40 }, 'bottom-right'],
    [{ left: 900, top: 10, width: 100, height: 40 }, 'bottom-left'],
    [{ left: 10, top: 700, width: 100, height: 40 }, 'top-right'],
    [{ left: 900, top: 700, width: 100, height: 40 }, 'top-left'],
  ])('a selection at %o puts it %s', (selection, expected) => {
    const { panel } = aPanel({}, {}, { selection });
    expect(corner(panel)).toBe(expected);
  });

  it('Move panel cycles through the corners clockwise', () => {
    const { panel, ui, clock } = aPanel();
    const move = moveButton(ui);
    expect(move).not.toBeNull();
    const corners = [corner(panel)];
    for (let i = 0; i < 4; i++) {
      fireEvent.click(move as HTMLElement);
      clock.time += 1000;
      corners.push(corner(panel));
    }
    expect(corners).toEqual([
      'bottom-right',
      'bottom-left',
      'top-left',
      'top-right',
      'bottom-right',
    ]);
  });
});

describe('REQ-SEC-005 the panel only acts on trusted input, and not right after it appears or moves', () => {
  it('ignores untrusted clicks', () => {
    const { ui, deps } = aPanel({}, {}, { trusted: false });
    fireEvent.click(chip(ui, 'Ribbon'));
    fireEvent.click(save(ui));
    fireEvent.click(ui.getByRole('button', { name: 'Cancel' }));
    expect(chip(ui, 'Ribbon').getAttribute('aria-pressed')).toBe('false');
    expect(deps.onSave).not.toHaveBeenCalled();
    expect(deps.onCancel).not.toHaveBeenCalled();
  });

  it('ignores an untrusted Escape', () => {
    const { panel, deps } = aPanel({}, {}, { trusted: false });
    fireEvent.keyDown(panel.element, { key: 'Escape' });
    expect(deps.onCancel).not.toHaveBeenCalled();
  });

  it('ignores activation within 500 ms of appearing', () => {
    const { ui, deps, clock } = aPanel({}, {}, { fresh: true });
    clock.time = 499;
    fireEvent.click(save(ui));
    fireEvent.click(ui.getByRole('radio', { name: 'Blue' }));
    expect(deps.onSave).not.toHaveBeenCalled();
    expect((ui.getByRole('radio', { name: 'Red' }) as HTMLInputElement).checked).toBe(true);
    clock.time = 500;
    fireEvent.click(save(ui));
    expect(deps.onSave).toHaveBeenCalledOnce();
  });

  it('ignores activation within 500 ms of moving', () => {
    const { ui, deps, clock } = aPanel();
    const move = moveButton(ui);
    expect(move).not.toBeNull();
    fireEvent.click(move as HTMLElement);
    clock.time += 300;
    fireEvent.click(save(ui));
    expect(deps.onSave).not.toHaveBeenCalled();
    clock.time += 200;
    fireEvent.click(save(ui));
    expect(deps.onSave).toHaveBeenCalledOnce();
  });
});

// ── Not granted (T-109) ───────────────────────────────────────────────────────────────────────

const notice = (panel: Panel) => panel.element.querySelector('[data-part="notice"]');

describe('REQ-PICK-006 after saving on a site that is not granted', () => {
  it('says the mark shows on this tab only and offers Allow instead of the form', () => {
    const { panel, ui } = aPanel();
    panel.showNotGranted();
    expect(notice(panel)?.textContent).toContain(LABELS.notGranted);
    expect(notice(panel)?.getAttribute('role')).toBe('status');
    expect(ui.queryByRole('textbox', { name: 'Selector' })).toBeNull();
    expect(ui.queryByRole('button', { name: 'Allow' })).not.toBeNull();
    expect(ui.queryByRole('button', { name: 'Close' })).not.toBeNull();
  });

  it('Allow asks for the grant page, Close ends the pick', () => {
    const { panel, ui, deps, clock } = aPanel();
    panel.showNotGranted();
    clock.time += 1000;
    const allow = ui.queryByRole('button', { name: 'Allow' });
    const close = ui.queryByRole('button', { name: 'Close' });
    expect([allow, close]).not.toContain(null);
    fireEvent.click(allow as HTMLElement);
    fireEvent.click(close as HTMLElement);
    expect(deps.onAllow).toHaveBeenCalledOnce();
    expect(deps.onClose).toHaveBeenCalledOnce();
  });

  it('ignores Allow within 500 ms of the notice appearing (REQ-SEC-005)', () => {
    const { panel, ui, deps, clock } = aPanel();
    panel.showNotGranted();
    clock.time += 300;
    const allow = ui.queryByRole('button', { name: 'Allow' });
    expect(allow).not.toBeNull();
    fireEvent.click(allow as HTMLElement);
    expect(deps.onAllow).not.toHaveBeenCalled();
  });
});

// ── Re-pick (T-110) ───────────────────────────────────────────────────────────────────────────

describe('REQ-PICK-007 a re-pick only replaces the selector', () => {
  const MARK = 'mark00000042' as MarkId;

  it('asks only for the selector', () => {
    const { ui } = aPanel({ repickMarkId: MARK });
    expect(ui.queryByRole('heading', { name: 'Choose the element again' })).not.toBeNull();
    expect(ui.queryByRole('textbox', { name: 'Selector' })).not.toBeNull();
    expect(ui.queryByRole('combobox', { name: 'Site group' })).toBeNull();
    expect(ui.queryByRole('group', { name: 'Effects' })).toBeNull();
    expect(ui.queryByRole('radiogroup', { name: 'Color' })).toBeNull();
  });

  it('sends the mark it replaces with the new selector', () => {
    const { ui, deps } = aPanel({ repickMarkId: MARK });
    typeSelector(ui, '#new-target');
    fireEvent.click(save(ui));
    expect(deps.onSave).toHaveBeenCalledWith(
      expect.objectContaining({ selector: '#new-target', repickMarkId: MARK }),
    );
  });
});

// ── User content (T-146) ──────────────────────────────────────────────────────────────────────

describe('REQ-I18N-003 the panel shows site group names as typed, never translated', () => {
  const NAMED = [
    { id: PROD, name: 'pickerSave' },
    { id: ADMIN, name: '__MSG_extName__' },
  ];
  const groupOptions = (ui: Ui) => {
    const select = ui.getByRole('combobox', { name: 'Site group' }) as HTMLSelectElement;
    return [...select.options].slice(0, NAMED.length);
  };

  it('lists the names literally', () => {
    const { ui } = aPanel({ context: { groups: NAMED, theme: 'system' } });
    expect(groupOptions(ui).map((option) => option.text)).toEqual([
      'pickerSave',
      '__MSG_extName__',
    ]);
  });

  it('keeps page translators away from them (translate="no")', () => {
    const { ui } = aPanel({ context: { groups: NAMED, theme: 'system' } });
    for (const option of groupOptions(ui)) {
      expect(option.closest('[translate="no"]'), option.text).not.toBeNull();
    }
  });
});
