import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { SiteGroup } from '@/core/model/schema';
import { anElementMark, aPageMark, aSiteGroup, aState } from '@/core/testing/builders';
import { axeViolations } from '../../../tests/unit/axe';
import { atHash, optionsBackground } from '../../../tests/unit/options-background';
import { byLabel, byRole, findRole } from '../../../tests/unit/queries';
import { OptionsApp } from './App';

const ribbon = aPageMark({ label: 'Prod ribbon' });
const outline = anElementMark({ target: { kind: 'element', selector: '#app' } });
const prod = aSiteGroup({ name: 'Production site', marks: [ribbon, outline] });

async function openAt(hash: string, group: SiteGroup = prod) {
  const background = optionsBackground(aState({ siteGroups: [group] }));
  atHash(hash);
  const view = render(<OptionsApp />);
  await screen.findByRole('main');
  return { background, container: view.container };
}

const groupHash = (group: SiteGroup = prod) => `#/groups/${group.id}`;
const markHash = (markId: string, group: SiteGroup = prod) => `${groupHash(group)}/marks/${markId}`;
const markList = () => byRole('list', { name: 'Marks' });
const markTexts = () =>
  within(markList())
    .queryAllByRole('listitem')
    .map((item) => item.querySelector('[data-summary]')?.textContent);
const editor = () => byRole('region', { name: 'Edit mark' });
const targetRadio = (name: 'Page' | 'Element') =>
  byRole('radio', { name }, byRole('radiogroup', { name: 'Target' }, editor()));
const selectorField = () => byLabel('CSS selector', editor());

function type(control: HTMLElement, value: string) {
  fireEvent.change(control, { target: { value } });
}

beforeEach(() => atHash(''));

describe('REQ-OPT-003 the site group editor lists its marks', () => {
  it('shows each mark with its label or target and its effects', async () => {
    await openAt(groupHash());
    expect(markTexts()).toEqual(['Prod ribbon · Page · Ribbon', 'Element · #app · Outline']);
  });

  it('links each mark to its editor', async () => {
    await openAt(groupHash());
    const [first] = within(markList()).getAllByRole('listitem');
    expect(byRole('link', { name: 'Edit “Prod ribbon · Page · Ribbon”' }, first)).toHaveAttribute(
      'href',
      markHash(ribbon.id),
    );
  });

  it('adds a page mark: a red ribbon with the site group name', async () => {
    const { background } = await openAt(groupHash());
    fireEvent.click(byRole('button', { name: 'Add page mark' }));
    await waitFor(() => expect(markTexts()).toHaveLength(3));
    expect(background.commands).toEqual([
      {
        type: 'addMark',
        groupId: prod.id,
        mark: {
          enabled: true,
          color: '#c93a2e',
          textColor: 'auto',
          target: { kind: 'page' },
          effects: { ribbon: { text: 'Production site', corner: 'top-right' } },
        },
      },
    ]);
  });

  it('removes a mark', async () => {
    const { background } = await openAt(groupHash());
    fireEvent.click(byRole('button', { name: 'Remove “Element · #app · Outline”' }, markList()));
    await waitFor(() => expect(markTexts()).toEqual(['Prod ribbon · Page · Ribbon']));
    expect(background.commands).toEqual([
      { type: 'removeMark', groupId: prod.id, markId: outline.id },
    ]);
  });
});

describe('REQ-A11Y-002 REQ-OPT-003 focus stays in the mark list after a Remove (WCAG 2.4.3)', () => {
  const remove = (summary: string) => byRole('button', { name: `Remove “${summary}”` }, markList());

  async function removeWithKeyboard(summary: string) {
    const button = remove(summary);
    button.focus();
    fireEvent.click(button);
    await waitFor(() => expect(button.isConnected).toBe(false));
  }

  it('moves focus to the Remove button of the mark that took its place', async () => {
    await openAt(groupHash());
    await removeWithKeyboard('Prod ribbon · Page · Ribbon');
    await waitFor(() => expect(remove('Element · #app · Outline')).toHaveFocus());
  });

  it('moves focus to the Marks heading when the last mark goes', async () => {
    const single = aSiteGroup({ name: 'Production site', marks: [ribbon] });
    await openAt(groupHash(single), single);
    await removeWithKeyboard('Prod ribbon · Page · Ribbon');
    await waitFor(() => expect(byRole('heading', { name: 'Marks' })).toHaveFocus());
  });
});

describe('REQ-A11Y-002 REQ-OPT-003 closing the mark editor keeps focus (WCAG 2.4.3)', () => {
  it("moves focus to the closed mark's Edit link", async () => {
    await openAt(markHash(outline.id));
    const close = byRole('link', { name: 'Close' }, editor());
    expect(close).toHaveAttribute('href', groupHash());
    close.focus();
    act(() => {
      atHash(groupHash());
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Edit mark' })).toBeNull());
    await waitFor(() =>
      expect(byRole('link', { name: 'Edit “Element · #app · Outline”' }, markList())).toHaveFocus(),
    );
  });
});

describe('REQ-OPT-003 the mark editor: target and selector', () => {
  it('opens from #/groups/:id/marks/:markId with the mark’s target', async () => {
    await openAt(markHash(ribbon.id));
    expect(targetRadio('Page')).toHaveAttribute('aria-checked', 'true');
    expect(within(editor()).queryByLabelText('CSS selector')).toBeNull();
  });

  it('shows nothing for a mark that no longer exists', async () => {
    await openAt(markHash('mrk-missing0'));
    await findRole('list', { name: 'Marks' });
    expect(screen.queryByRole('region', { name: 'Edit mark' })).toBeNull();
  });

  it('saves a new selector when the field loses focus', async () => {
    const { background } = await openAt(markHash(outline.id));
    expect(selectorField()).toHaveValue('#app');
    type(selectorField(), '#main .header');
    fireEvent.blur(selectorField());
    await waitFor(() => expect(markTexts()[1]).toBe('Element · #main .header · Outline'));
    const { id: _id, ...draft } = outline;
    expect(background.commands).toEqual([
      {
        type: 'updateMark',
        groupId: prod.id,
        markId: outline.id,
        mark: { ...draft, target: { kind: 'element', selector: '#main .header' } },
      },
    ]);
  });

  it.each(['#main >', 'div[', ''])('refuses the selector %j with a reason', async (selector) => {
    const { background } = await openAt(markHash(outline.id));
    type(selectorField(), selector);
    fireEvent.blur(selectorField());
    expect(selectorField()).toHaveAccessibleDescription(
      expect.stringContaining("This isn't a valid CSS selector."),
    );
    expect(selectorField()).toHaveAttribute('aria-invalid', 'true');
    expect(background.commands).toEqual([]);
  });

  it('turns a page mark into an element mark once it has a selector', async () => {
    const { background } = await openAt(markHash(ribbon.id));
    act(() => fireEvent.click(targetRadio('Element')));
    expect(selectorField()).toHaveValue('');
    expect(background.commands).toEqual([]);
    type(selectorField(), '#app');
    fireEvent.blur(selectorField());
    await waitFor(() => expect(markTexts()[0]).toBe('Prod ribbon · Element · #app · Ribbon'));
    expect(background.commands.at(-1)).toMatchObject({
      type: 'updateMark',
      mark: { target: { kind: 'element', selector: '#app' }, effects: ribbon.effects },
    });
  });

  it('turns an element mark into a page mark, keeping only effects a page has', async () => {
    const { background } = await openAt(markHash(outline.id));
    fireEvent.click(targetRadio('Page'));
    await waitFor(() => expect(markTexts()[1]).toBe('Page · Ribbon'));
    expect(background.commands.at(-1)).toMatchObject({
      type: 'updateMark',
      mark: {
        target: { kind: 'page' },
        effects: { ribbon: { text: 'Production site', corner: 'top-right' } },
      },
    });
  });

  it('has no axe violations', async () => {
    const { container } = await openAt(markHash(outline.id));
    editor();
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('REQ-MARK-012 color presets, a custom hex color and the native picker', () => {
  const swatch = (name: string) =>
    byRole('radio', { name }, byRole('radiogroup', { name: 'Color' }, editor()));
  const customColor = () => byLabel('Custom color', editor());
  const lastMark = (background: { commands: readonly unknown[] }) =>
    (background.commands.at(-1) as { mark?: { color?: string; textColor?: string } }).mark;

  it('offers the four presets and checks the mark’s color', async () => {
    await openAt(markHash(ribbon.id));
    expect(
      ['Red', 'Amber', 'Blue', 'Slate'].map((name) => swatch(name).getAttribute('aria-checked')),
    ).toEqual(['true', 'false', 'false', 'false']);
  });

  it('saves a preset when it is chosen', async () => {
    const { background } = await openAt(markHash(ribbon.id));
    fireEvent.click(swatch('Blue'));
    await waitFor(() => expect(swatch('Blue')).toHaveAttribute('aria-checked', 'true'));
    expect(background.commands).toEqual([
      { type: 'updateMark', groupId: prod.id, markId: ribbon.id, mark: expect.any(Object) },
    ]);
    expect(lastMark(background)).toMatchObject({ color: '#1f6feb', target: ribbon.target });
  });

  it('saves a custom hex color, lowercased, when the field loses focus', async () => {
    const { background } = await openAt(markHash(ribbon.id));
    expect(customColor()).toHaveValue('#c93a2e');
    type(customColor(), '#ABCDEF');
    fireEvent.blur(customColor());
    await waitFor(() => expect(lastMark(background)?.color).toBe('#abcdef'));
    await waitFor(() => expect(swatch('Red')).toHaveAttribute('aria-checked', 'false'));
  });

  it('refuses a color that is not a hex value', async () => {
    const { background } = await openAt(markHash(ribbon.id));
    type(customColor(), 'red');
    fireEvent.blur(customColor());
    expect(customColor()).toHaveAccessibleDescription(
      expect.stringContaining('Enter a color like #1f6feb.'),
    );
    expect(background.commands).toEqual([]);
  });

  it('saves the color picked with the native picker', async () => {
    const { background } = await openAt(markHash(ribbon.id));
    type(byLabel('Pick a color', editor()), '#123456');
    await waitFor(() => expect(lastMark(background)?.color).toBe('#123456'));
  });
});

describe('REQ-MARK-011 text color: automatic black or white, or custom', () => {
  const textColor = (name: 'Auto' | 'Custom') =>
    byRole('radio', { name }, byRole('radiogroup', { name: 'Text color' }, editor()));
  const lastTextColor = (background: { commands: readonly unknown[] }) =>
    (background.commands.at(-1) as { mark?: { textColor?: string } }).mark?.textColor;

  it('is automatic by default and says which color that gives', async () => {
    await openAt(markHash(ribbon.id));
    expect(textColor('Auto')).toHaveAttribute('aria-checked', 'true');
    expect(editor()).toHaveTextContent('Automatic: white text on this color.');
  });

  it('switches to a custom text color, starting from the automatic one', async () => {
    const { background } = await openAt(markHash(ribbon.id));
    fireEvent.click(textColor('Custom'));
    await waitFor(() => expect(lastTextColor(background)).toBe('#ffffff'));
    const field = await findRole('textbox', { name: 'Custom text color' }, editor());
    expect(field).toHaveValue('#ffffff');
    type(field, '#000000');
    fireEvent.blur(field);
    await waitFor(() => expect(lastTextColor(background)).toBe('#000000'));
  });

  it('goes back to automatic', async () => {
    const custom = aPageMark({ textColor: '#000000' as never });
    const group = aSiteGroup({ name: 'Custom', marks: [custom] });
    const { background } = await openAt(markHash(custom.id, group), group);
    expect(textColor('Custom')).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(textColor('Auto'));
    await waitFor(() => expect(lastTextColor(background)).toBe('auto'));
  });
});

describe('REQ-OPT-003 REQ-MARK-014 effect controls for the mark’s target', () => {
  const effects = () => byRole('group', { name: 'Effects' }, editor());
  const toggle = (name: string) => byRole('switch', { name }, effects());
  const toggleNames = () =>
    within(effects())
      .getAllByRole('switch')
      .map((box) => box.closest('span')?.querySelector('label')?.textContent);
  const lastEffects = (background: { commands: readonly unknown[] }) =>
    (background.commands.at(-1) as { mark?: { effects?: unknown } }).mark?.effects;

  it('offers only the effects a page mark can have', async () => {
    await openAt(markHash(ribbon.id));
    expect(toggleNames()).toEqual([
      'Ribbon',
      'Banner',
      'Frame',
      'Tint',
      'Stripes',
      'Watermark',
      'Title prefix',
      'Favicon',
    ]);
  });

  it('offers only the effects an element mark can have', async () => {
    await openAt(markHash(outline.id));
    expect(toggleNames()).toEqual(['Ribbon', 'Outline', 'Pulse', 'Tint', 'Stripes']);
  });

  it('shows which effects are on and keeps the last one on', async () => {
    await openAt(markHash(ribbon.id));
    expect(toggle('Ribbon')).toBeChecked();
    expect(toggle('Ribbon')).toBeDisabled();
    expect(toggle('Frame')).not.toBeChecked();
  });

  it('says why the last effect can’t be turned off (WCAG 1.3.1)', async () => {
    await openAt(markHash(ribbon.id));
    expect(toggle('Ribbon')).toHaveAccessibleDescription('A mark needs at least one effect.');
    expect(toggle('Frame')).not.toHaveAccessibleDescription();
  });

  it('turns an effect on with its defaults and shows its settings', async () => {
    const { background } = await openAt(markHash(ribbon.id));
    fireEvent.click(toggle('Frame'));
    await waitFor(() => expect(toggle('Frame')).toBeChecked());
    expect(lastEffects(background)).toEqual({ ...ribbon.effects, frame: { widthPx: 4 } });
    const width = byRole('slider', { name: 'Frame width' }, effects());
    expect(width).toHaveAttribute('min', '2');
    expect(width).toHaveAttribute('max', '16');
    expect(toggle('Ribbon')).toBeEnabled();
  });

  it('turns an effect off', async () => {
    const both = aPageMark({
      effects: { ribbon: { text: 'PROD', corner: 'top-left' }, frame: { widthPx: 6 } },
    });
    const group = aSiteGroup({ name: 'Both', marks: [both] });
    const { background } = await openAt(markHash(both.id, group), group);
    fireEvent.click(toggle('Frame'));
    await waitFor(() => expect(toggle('Frame')).not.toBeChecked());
    expect(lastEffects(background)).toEqual({ ribbon: { text: 'PROD', corner: 'top-left' } });
  });

  it('uses the tint range of the target: 3–15 % on a page, 5–40 % on an element', async () => {
    const tinted = aPageMark({ effects: { tint: { opacityPct: 10 } } });
    const tintedElement = anElementMark({ effects: { tint: { opacityPct: 30 } } });
    const group = aSiteGroup({ name: 'Tints', marks: [tinted, tintedElement] });
    const { background } = await openAt(markHash(tinted.id, group), group);
    const slider = () => byRole('slider', { name: 'Tint opacity' }, effects());
    expect([slider().getAttribute('min'), slider().getAttribute('max')]).toEqual(['3', '15']);
    fireEvent.change(slider(), { target: { value: '12' } });
    await waitFor(() => expect(lastEffects(background)).toEqual({ tint: { opacityPct: 12 } }));
    act(() => atHash(markHash(tintedElement.id, group)));
    act(() => window.dispatchEvent(new HashChangeEvent('hashchange')));
    await waitFor(() => expect(slider()).toHaveAttribute('max', '40'));
    expect(slider()).toHaveAttribute('min', '5');
  });

  it('saves a ribbon corner', async () => {
    const { background } = await openAt(markHash(ribbon.id));
    const corners = byRole('radiogroup', { name: 'Ribbon corner' }, effects());
    fireEvent.click(byRole('radio', { name: 'Bottom left' }, corners));
    await waitFor(() =>
      expect(lastEffects(background)).toEqual({ ribbon: { text: 'PROD', corner: 'bottom-left' } }),
    );
  });
});

describe('REQ-MARK-015 ribbon and banner text is required', () => {
  const ribbonText = () => byLabel('Ribbon text', editor());

  it('saves a new ribbon text on blur, at most 16 characters', async () => {
    const { background } = await openAt(markHash(ribbon.id));
    expect(ribbonText()).toHaveValue('PROD');
    expect(ribbonText()).toHaveAttribute('maxlength', '16');
    type(ribbonText(), 'LIVE');
    fireEvent.blur(ribbonText());
    await waitFor(() =>
      expect(background.commands.at(-1)).toMatchObject({
        mark: { effects: { ribbon: { text: 'LIVE', corner: 'top-right' } } },
      }),
    );
  });

  it('refuses an empty text, so a mark never relies on color alone', async () => {
    const { background } = await openAt(markHash(ribbon.id));
    type(ribbonText(), '   ');
    fireEvent.blur(ribbonText());
    expect(ribbonText()).toHaveAccessibleDescription(
      expect.stringContaining("Enter a text, so the mark doesn't rely on color alone."),
    );
    expect(background.commands).toEqual([]);
  });
});
