import { presetColor } from '@/core/model/presets';
import type { ElementEffects, Hex, MarkBase, PageEffects } from '@/core/model/schema';
import { nameRibbon } from '@/ui/components/mark-form/effect-catalog';

// The playground's state (REQ-PLAY-001): what the options page's mark form edits, as the extension
// stores it. The form refuses invalid input itself (REQ-PLAY-006), so these marks are always valid.

/** The sample site group's name: the starting text of every effect. */
export const PLAYGROUND_NAME = 'PROD';

export type PlaygroundState = {
  /** The SiteMark switch: with it off, the page has no marks at all. */
  readonly enabled: boolean;
  readonly color: Hex;
  readonly textColor: MarkBase['textColor'];
  readonly pageEffects: PageEffects;
  /** The sample page's "Delete customer" button; it has no mark while this is undefined. */
  readonly elementEffects: ElementEffects | undefined;
};

export function initialPlaygroundState(): PlaygroundState {
  return {
    enabled: true,
    color: presetColor('red'),
    textColor: 'auto',
    pageEffects: { ribbon: nameRibbon(PLAYGROUND_NAME) },
    elementEffects: undefined,
  };
}

/** What the element mark starts with when it is turned on. */
export const DEFAULT_ELEMENT_EFFECTS: ElementEffects = {
  outline: { widthPx: 2, style: 'solid', pulse: false },
};
