import { notImplemented } from '../not-implemented';
import type { Hex } from './schema';

export type PresetName = 'red' | 'amber' | 'blue' | 'slate';
export type ColorPreset = { readonly name: PresetName; readonly color: Hex };

/** The colorblind-safe presets in picker order (REQ-MARK-012, D-205). */
export function colorPresets(): readonly ColorPreset[] {
  return notImplemented();
}

export function presetColor(_name: PresetName): Hex {
  return notImplemented();
}
