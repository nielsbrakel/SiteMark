import type { ElementEffectKind, SavePick } from '../../app/protocol';
import type { PickerContext } from '../../app/use-cases/picker-context';
import type { PresetName } from '../../core/model/presets';
import { notImplemented } from '../../core/not-implemented';

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
};

export type PanelDeps = {
  /** The generated selector (REQ-PICK-004); the user may edit it. */
  readonly selector: string;
  readonly context: PickerContext;
  /** `location.host`, for "New site group for <origin>". */
  readonly origin: string;
  readonly labels: PanelLabels;
  /** How many elements the selector matches in the page; `undefined` when it isn't valid. */
  readonly countMatches: (selector: string) => number | undefined;
  readonly onSave: (pick: SavePick) => void;
  readonly onCancel: () => void;
  /** Save, then open the options page at the new mark. */
  readonly onMoreOptions: (pick: SavePick) => void;
};

export type Panel = {
  readonly element: HTMLElement;
  dispose(): void;
};

/** The mini panel after a selection (REQ-PICK-005). */
export function createPanel(_parent: HTMLElement, _deps: PanelDeps): Panel {
  return notImplemented();
}
