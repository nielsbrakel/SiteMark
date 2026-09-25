import type { Hex } from './schema';

export type PresetName = 'red' | 'amber' | 'blue' | 'slate';
export type ColorPreset = { readonly name: PresetName; readonly color: Hex };

/** Picker order is key order. */
const COLORS: Readonly<Record<PresetName, Hex>> = {
  red: '#c93a2e' as Hex,
  amber: '#f4a300' as Hex,
  blue: '#1f6feb' as Hex,
  slate: '#57606a' as Hex,
};

const PRESETS: readonly ColorPreset[] = Object.freeze(
  (Object.keys(COLORS) as PresetName[]).map((name) => Object.freeze({ name, color: COLORS[name] })),
);

/** The colorblind-safe presets in picker order (REQ-MARK-012, D-205). */
export function colorPresets(): readonly ColorPreset[] {
  return PRESETS;
}

export function presetColor(name: PresetName): Hex {
  return COLORS[name];
}
