import type { ElementEffectKind } from '../../app/protocol';
import type { PickerContext } from '../../app/use-cases/picker-context';
import type { SiteGroupId } from '../../core/ids';
import { type ColorPreset, colorPresets, type PresetName } from '../../core/model/presets';
import type { Hex } from '../../core/model/schema';

// The mini panel's fields (REQ-PICK-005), built with createElement: page-controlled text (the
// selector, group names, the origin) only ever goes in as text or as a form value.

/** The panel's texts, from browser.i18n (picker-ports.ts). */
export type PanelLabels = {
  readonly title: string;
  readonly selector: string;
  readonly matchOne: string;
  readonly matchNone: string;
  readonly matchInvalid: string;
  readonly matchMany: (count: number) => string;
  readonly siteGroup: string;
  readonly newSiteGroup: (origin: string) => string;
  readonly effects: string;
  readonly effectNames: Readonly<Record<ElementEffectKind, string>>;
  readonly color: string;
  readonly colorNames: Readonly<Record<PresetName, string>>;
  readonly save: string;
  readonly cancel: string;
  readonly moreOptions: string;
  readonly movePanel: string;
  readonly notGranted: string;
  readonly allow: string;
  readonly close: string;
  readonly repickTitle: string;
};

/** Chip order is the order the effects are saved in. */
const EFFECTS: readonly ElementEffectKind[] = ['ribbon', 'outline', 'tint', 'stripes'];
const DEFAULT_EFFECT: ElementEffectKind = 'outline';

let lastId = 0;
/** IDs for label/field pairs, unique within the picker's shadow root. */
const nextId = (name: string) => `sm-${name}-${++lastId}`;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function labelledRow(text: string): { row: HTMLElement; label: HTMLElement; id: string } {
  const row = el('div', 'sm-panel__row');
  const label = el('span', 'sm-panel__label', text);
  label.id = nextId('label');
  row.append(label);
  return { row, label, id: label.id };
}

export function selectorField(labels: PanelLabels, value: string, onInput: () => void) {
  const row = el('div', 'sm-panel__row');
  const label = el('label', 'sm-panel__label', labels.selector);
  const input = el('input', 'sm-panel__input');
  input.id = nextId('selector');
  label.htmlFor = input.id;
  Object.assign(input, { type: 'text', value, spellcheck: false, autocomplete: 'off' });
  const match = el('output', 'sm-panel__match');
  match.dataset.part = 'match';
  match.setAttribute('aria-live', 'polite');
  input.addEventListener('input', onInput);
  row.append(label, input, match);
  return { row, input, match };
}

export function groupField(labels: PanelLabels, context: PickerContext, origin: string) {
  const row = el('div', 'sm-panel__row');
  const label = el('label', 'sm-panel__label', labels.siteGroup);
  const select = el('select', 'sm-panel__select');
  select.id = nextId('group');
  label.htmlFor = select.id;
  const option = (text: string, value: string) => {
    const element = el('option', '', text);
    element.value = value;
    return element;
  };
  const groupOptions = context.groups.map((group) => option(group.name, group.id));
  // Names are user content (REQ-I18N-003): page translators leave them as typed.
  for (const element of groupOptions) element.setAttribute('translate', 'no');
  select.append(...groupOptions);
  select.append(option(labels.newSiteGroup(origin), ''));
  row.append(label, select);
  /** The chosen active group, or `undefined` for "New site group". */
  const chosen = (): SiteGroupId | undefined => context.groups[select.selectedIndex]?.id;
  return { row, chosen };
}

export function effectChips(labels: PanelLabels, onChange: () => void) {
  const { row, id } = labelledRow(labels.effects);
  const group = el('div', 'sm-panel__chips');
  group.setAttribute('role', 'group');
  group.setAttribute('aria-labelledby', id);
  const selected = new Set<ElementEffectKind>([DEFAULT_EFFECT]);
  for (const effect of EFFECTS) {
    const chip = el('button', 'sm-panel__chip', labels.effectNames[effect]);
    chip.type = 'button';
    chip.setAttribute('aria-pressed', String(selected.has(effect)));
    chip.addEventListener('click', () => {
      if (!selected.delete(effect)) selected.add(effect);
      chip.setAttribute('aria-pressed', String(selected.has(effect)));
      onChange();
    });
    group.append(chip);
  }
  row.append(group);
  return { row, effects: () => EFFECTS.filter((effect) => selected.has(effect)) };
}

export function colorField(labels: PanelLabels) {
  const { row, id } = labelledRow(labels.color);
  const group = el('div', 'sm-panel__swatches');
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-labelledby', id);
  const name = nextId('color');
  const radios = colorPresets().map(({ name: preset, color }, index) => {
    const radio = el('input', 'sm-panel__swatch');
    Object.assign(radio, { type: 'radio', name, value: color, checked: index === 0 });
    radio.setAttribute('aria-label', labels.colorNames[preset]);
    // A preset from core: a validated hex (REQ-RND-011).
    radio.style.setProperty('--sm-swatch', color);
    return radio;
  });
  let chosen = 0;
  radios.forEach((radio, index) => {
    radio.addEventListener('change', () => {
      chosen = index;
    });
  });
  group.append(...radios);
  row.append(group);
  const presets = colorPresets();
  const color = (): Hex => (presets[chosen] ?? (presets[0] as ColorPreset)).color;
  /** Shows the chosen color again (after a blocked click). */
  const sync = () => {
    radios.forEach((radio, index) => {
      radio.checked = index === chosen;
    });
  };
  return { row, color, sync };
}

function button(text: string, className: string): HTMLButtonElement {
  const element = el('button', className, text);
  element.type = 'button';
  return element;
}

export function panelActions(labels: PanelLabels) {
  const row = el('div', 'sm-panel__actions');
  const more = button(labels.moreOptions, 'sm-panel__button sm-panel__button--link');
  const cancel = button(labels.cancel, 'sm-panel__button');
  const save = button(labels.save, 'sm-panel__button sm-panel__button--primary');
  row.append(more, cancel, save);
  return { row, more, cancel, save };
}

/** "Shown on this tab only…" with Allow and Close (REQ-PICK-006). */
export function notGrantedNotice(labels: PanelLabels) {
  const notice = el('p', 'sm-panel__notice', labels.notGranted);
  notice.dataset.part = 'notice';
  notice.setAttribute('role', 'status');
  const row = el('div', 'sm-panel__actions');
  const close = button(labels.close, 'sm-panel__button');
  const allow = button(labels.allow, 'sm-panel__button sm-panel__button--primary');
  row.append(close, allow);
  return { notice, row, allow, close };
}
