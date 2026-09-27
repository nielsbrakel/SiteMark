import type { SavePick } from '../../app/protocol';
import type { PickerContext } from '../../app/use-cases/picker-context';
import {
  colorField,
  effectChips,
  el,
  groupField,
  type PanelLabels,
  panelActions,
  selectorField,
} from './panel-fields';

// The mini panel after a selection (REQ-PICK-005): an editable selector with a live match
// indicator, the site group, effect chips and a color. Save hands a `savePick` intent to the
// caller; the background decides where it goes (REQ-SEC-001). The panel never asks for a
// permission and takes no URL pattern (REQ-SEC-005).

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

function matchText(labels: PanelLabels, count: number | undefined): string {
  if (count === undefined) return `✕ ${labels.matchInvalid}`;
  if (count === 0) return `✕ ${labels.matchNone}`;
  return count === 1 ? `✓ ${labels.matchOne}` : labels.matchMany(count);
}

function panelShell(deps: PanelDeps): HTMLElement {
  const element = el('section', 'sm-theme sm-panel');
  element.dataset.part = 'panel';
  element.setAttribute('role', 'dialog');
  const { theme } = deps.context;
  if (theme !== 'system') element.dataset.theme = theme;
  const title = el('h2', 'sm-panel__title', deps.labels.title);
  title.id = 'sm-panel-title';
  element.setAttribute('aria-labelledby', title.id);
  element.append(title);
  return element;
}

/** The mini panel after a selection (REQ-PICK-005). */
export function createPanel(parent: HTMLElement, deps: PanelDeps): Panel {
  const { labels } = deps;
  const element = panelShell(deps);
  const selector = selectorField(labels, deps.selector, () => update());
  const group = groupField(labels, deps.context, deps.origin);
  const chips = effectChips(labels, () => update());
  const color = colorField(labels);
  const actions = panelActions(labels);
  element.append(selector.row, group.row, chips.row, color.row, actions.row);

  const pick = (): SavePick => {
    const siteGroupId = group.chosen();
    return {
      selector: selector.input.value.trim(),
      ...(siteGroupId && { siteGroupId }),
      effects: chips.effects(),
      color: color.color(),
    };
  };
  function update(): void {
    const count = deps.countMatches(selector.input.value.trim());
    selector.match.textContent = matchText(labels, count);
    const canSave = count !== undefined && count > 0 && chips.effects().length > 0;
    actions.save.disabled = !canSave;
    actions.more.disabled = !canSave;
  }
  actions.save.addEventListener('click', () => deps.onSave(pick()));
  actions.more.addEventListener('click', () => deps.onMoreOptions(pick()));
  actions.cancel.addEventListener('click', () => deps.onCancel());
  update();
  parent.append(element);
  return { element, dispose: () => element.remove() };
}
