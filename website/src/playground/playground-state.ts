import type { PresetName } from '@/core/model/presets';
import type { Corner, ElementEffects, Hex, PageEffects } from '@/core/model/schema';
import { notImplemented } from '@/core/not-implemented';

export type PageEffectName = Exclude<keyof PageEffects, 'favicon'>;
export type ElementEffectName = keyof ElementEffects;
export type PlaygroundPreset = PresetName | 'custom';
export type PlaygroundError = 'optionsHexInvalid' | 'optionsTextRequired';

export const PAGE_EFFECTS: readonly PageEffectName[] = [];
export const ELEMENT_EFFECTS: readonly ElementEffectName[] = [];

export type PlaygroundState = {
  readonly preset: PlaygroundPreset;
  readonly color: Hex;
  readonly hexInput: string;
  readonly text: string;
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

export function initialPlaygroundState(): PlaygroundState {
  return notImplemented();
}

export function playgroundReducer(
  _state: PlaygroundState,
  _action: PlaygroundAction,
): PlaygroundState {
  return notImplemented();
}
