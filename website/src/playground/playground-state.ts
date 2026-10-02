import { type PresetName, presetColor } from '@/core/model/presets';
import {
  type Corner,
  type ElementEffects,
  type Hex,
  type PageEffects,
  parseHex,
  parseMarkDraft,
} from '@/core/model/schema';
import { assertNever } from '@/core/result';

// The playground's state (REQ-PLAY-001): a pure reducer over what the controls say. Its marks are
// always valid: custom input is checked with the core schemas (REQ-PLAY-006), and a refused value
// leaves the last valid one in place while its field shows the options page's error message.

export type PageEffectName = Exclude<keyof PageEffects, 'favicon'>;
export type ElementEffectName = keyof ElementEffects;
export type PlaygroundPreset = PresetName | 'custom';
/** The options page's messages for refused input (public/_locales). */
export type PlaygroundError = 'optionsHexInvalid' | 'optionsTextRequired';

export const PAGE_EFFECTS: readonly PageEffectName[] = [
  'ribbon',
  'banner',
  'frame',
  'tint',
  'stripes',
  'watermark',
  'titlePrefix',
];
export const ELEMENT_EFFECTS: readonly ElementEffectName[] = [
  'outline',
  'tint',
  'stripes',
  'ribbon',
];

export type PlaygroundState = {
  readonly preset: PlaygroundPreset;
  /** The marks' color: always a valid hex. */
  readonly color: Hex;
  /** The custom color field as typed. */
  readonly hexInput: string;
  /** The text of the ribbon, banner, watermark and title prefix: always valid. */
  readonly text: string;
  /** The mark text field as typed. */
  readonly textInput: string;
  readonly corner: Corner;
  readonly edge: 'top' | 'bottom';
  readonly pageEffects: readonly PageEffectName[];
  readonly elementEffects: readonly ElementEffectName[];
  readonly errors: { readonly hex?: PlaygroundError; readonly text?: PlaygroundError };
};

export type PlaygroundAction =
  | { readonly type: 'preset'; readonly preset: PlaygroundPreset }
  | { readonly type: 'hex'; readonly text: string }
  | { readonly type: 'text'; readonly text: string }
  | { readonly type: 'corner'; readonly corner: Corner }
  | { readonly type: 'edge'; readonly edge: 'top' | 'bottom' }
  | { readonly type: 'pageEffect'; readonly effect: PageEffectName; readonly on: boolean }
  | { readonly type: 'elementEffect'; readonly effect: ElementEffectName; readonly on: boolean };

/** The ribbon and title prefix allow 16 characters, the fewest of the texts it feeds. */
export const MARK_TEXT_MAX = 16;

export function initialPlaygroundState(): PlaygroundState {
  const color = presetColor('red');
  return {
    preset: 'red',
    color,
    hexInput: color,
    text: 'PROD',
    textInput: 'PROD',
    corner: 'top-right',
    edge: 'top',
    pageEffects: ['ribbon'],
    elementEffects: [],
    errors: {},
  };
}

/** A custom color through the core schema; the `#` may be left out, as on the options page. */
function customColor(text: string): Hex | undefined {
  const trimmed = text.trim();
  const parsed = parseHex(trimmed.startsWith('#') ? trimmed : `#${trimmed}`);
  return parsed.ok ? parsed.value : undefined;
}

/** A mark text through the core schema (the ribbon's limits), cleaned as the schema stores it. */
function markText(text: string): string | undefined {
  const draft = {
    enabled: true,
    color: presetColor('red'),
    textColor: 'auto',
    target: { kind: 'page' },
    effects: { ribbon: { text: text.slice(0, MARK_TEXT_MAX), corner: 'top-right' } },
  };
  const parsed = parseMarkDraft(draft);
  return parsed.ok ? parsed.value.effects.ribbon?.text : undefined;
}

function withoutError(state: PlaygroundState, field: 'hex' | 'text'): PlaygroundState['errors'] {
  const { [field]: _dropped, ...rest } = state.errors;
  return rest;
}

function choosePreset(state: PlaygroundState, preset: PlaygroundPreset): PlaygroundState {
  if (preset === 'custom') return setHex({ ...state, preset }, state.hexInput);
  const color = presetColor(preset);
  return { ...state, preset, color, hexInput: color, errors: withoutError(state, 'hex') };
}

function setHex(state: PlaygroundState, text: string): PlaygroundState {
  const color = customColor(text);
  const next = { ...state, preset: 'custom', hexInput: text } as const;
  return color
    ? { ...next, color, errors: withoutError(state, 'hex') }
    : { ...next, errors: { ...state.errors, hex: 'optionsHexInvalid' } };
}

function setText(state: PlaygroundState, input: string): PlaygroundState {
  const text = markText(input);
  return text
    ? { ...state, text, textInput: input, errors: withoutError(state, 'text') }
    : { ...state, textInput: input, errors: { ...state.errors, text: 'optionsTextRequired' } };
}

/** Turns one effect of a catalog on or off; the list keeps the catalog's order. */
function toggled<E extends string>(
  catalog: readonly E[],
  on: readonly E[],
  effect: E,
  isOn: boolean,
) {
  return catalog.filter((name) => (name === effect ? isOn : on.includes(name)));
}

export function playgroundReducer(
  state: PlaygroundState,
  action: PlaygroundAction,
): PlaygroundState {
  switch (action.type) {
    case 'preset':
      return choosePreset(state, action.preset);
    case 'hex':
      return setHex(state, action.text);
    case 'text':
      return setText(state, action.text);
    case 'corner':
      return { ...state, corner: action.corner };
    case 'edge':
      return { ...state, edge: action.edge };
    case 'pageEffect':
      return {
        ...state,
        pageEffects: toggled(PAGE_EFFECTS, state.pageEffects, action.effect, action.on),
      };
    case 'elementEffect': {
      const { effect, on } = action;
      return {
        ...state,
        elementEffects: toggled(ELEMENT_EFFECTS, state.elementEffects, effect, on),
      };
    }
    default:
      return assertNever(action);
  }
}
