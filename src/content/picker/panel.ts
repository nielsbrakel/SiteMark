import type { SavePick } from '../../app/protocol';
import type { PickerContext } from '../../app/use-cases/picker-context';
import type { MarkId } from '../../core/ids';
import {
  colorField,
  effectChips,
  el,
  groupField,
  notGrantedNotice,
  type PanelLabels,
  panelActions,
  selectorField,
} from './panel-fields';
import { type ActivationGuard, guardActivation, type TrustDeps } from './panel-guard';
import { type Box, nextCorner, oppositeCorner, type PanelCorner } from './panel-placement';

// The mini panel after a selection (REQ-PICK-005): an editable selector with a live match
// indicator, the site group, effect chips and a color. Save hands a `savePick` intent to the
// caller; the background decides where it goes (REQ-SEC-001). The panel never asks for a
// permission and takes no URL pattern (REQ-SEC-005).

export type PanelDeps = Partial<TrustDeps> & {
  /** Re-pick (REQ-PICK-007): the pick only replaces the selector of this mark. */
  readonly repickMarkId?: MarkId;
  /** The selected element's box: the panel goes to the opposite corner (REQ-A11Y-010). */
  readonly selection: Box;
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
  /** "Allow" in the not-granted notice: the grant page for this site (REQ-PICK-006). */
  readonly onAllow?: () => void;
  /** Closes the notice: the pick is done. */
  readonly onClose?: () => void;
};

export type Panel = {
  readonly element: HTMLElement;
  /** After a save on a site that isn't granted: "Shown on this tab only" + Allow (REQ-PICK-006). */
  showNotGranted(): void;
  dispose(): void;
};

function matchText(labels: PanelLabels, count: number | undefined): string {
  if (count === undefined) return `✕ ${labels.matchInvalid}`;
  if (count === 0) return `✕ ${labels.matchNone}`;
  return count === 1 ? `✓ ${labels.matchOne}` : labels.matchMany(count);
}

function panelShell(deps: PanelDeps): { element: HTMLElement; move: HTMLButtonElement } {
  const element = el('section', 'sm-theme sm-panel');
  element.dataset.part = 'panel';
  element.setAttribute('role', 'dialog');
  element.setAttribute('aria-modal', 'true');
  const { theme } = deps.context;
  if (theme !== 'system') element.dataset.theme = theme;
  const header = el('div', 'sm-panel__header');
  const title = el('h2', 'sm-panel__title', deps.labels.title);
  title.id = 'sm-panel-title';
  element.setAttribute('aria-labelledby', title.id);
  const move = el('button', 'sm-panel__icon', '⇆');
  move.type = 'button';
  move.setAttribute('aria-label', deps.labels.movePanel);
  move.title = deps.labels.movePanel;
  header.append(title, move);
  element.append(header);
  return { element, move };
}

/** Puts the panel in the corner opposite the selection; Move panel cycles clockwise. */
function placePanel(element: HTMLElement, move: HTMLElement, deps: PanelDeps, onMove: () => void) {
  const viewport = { width: innerWidth, height: innerHeight };
  element.dataset.corner = oppositeCorner(deps.selection, viewport);
  move.addEventListener('click', () => {
    element.dataset.corner = nextCorner(element.dataset.corner as PanelCorner);
    onMove();
  });
}

const TABBABLE = 'button, input, select, textarea, a[href]';

/**
 * Keeps Tab inside the panel (REQ-PICK-003, WCAG 2.4.3): past the last control it wraps to the
 * first and back, so the page behind the glass pane never gets the focus.
 */
function trapTab(element: HTMLElement, event: KeyboardEvent): void {
  const controls = [...element.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (control) => control.tabIndex >= 0 && !(control as HTMLButtonElement).disabled,
  );
  const first = controls[0];
  const last = controls.at(-1);
  const active = (element.getRootNode() as Document | ShadowRoot).activeElement;
  const target = event.shiftKey
    ? active === first
      ? last
      : undefined
    : active === last
      ? first
      : undefined;
  if (!target) return;
  event.preventDefault();
  target.focus();
}

/** Input on the panel stays SiteMark's: nothing bubbles on to the page's listeners. Esc cancels. */
function isolate(element: HTMLElement, trust: TrustDeps, onCancel: () => void): void {
  const stop = (event: Event) => event.stopPropagation();
  for (const type of ['keyup', 'keypress', 'pointerdown', 'mousedown', 'click', 'input']) {
    element.addEventListener(type, stop);
  }
  element.addEventListener('keydown', (event) => {
    stop(event);
    if (event.key === 'Tab') trapTab(element, event);
    if (event.key === 'Escape' && trust.isTrusted(event)) onCancel();
  });
}

/** Re-pick: only the selector matters, so the other choices are left out (REQ-PICK-007). */
function enterRepickMode(element: HTMLElement, hidden: readonly HTMLElement[], title: string) {
  for (const part of hidden) part.remove();
  const heading = element.querySelector('.sm-panel__title');
  if (heading) heading.textContent = title;
}

/** Swaps the form (everything below the header) for the not-granted notice (REQ-PICK-006). */
function showNotice(element: HTMLElement, deps: PanelDeps, guard: ActivationGuard): void {
  while (element.children.length > 1) element.lastElementChild?.remove();
  const shown = notGrantedNotice(deps.labels);
  shown.allow.addEventListener('click', () => deps.onAllow?.());
  shown.close.addEventListener('click', () => deps.onClose?.());
  element.append(shown.notice, shown.row);
  // The panel changed under the pointer: the delay starts again (REQ-SEC-005).
  guard.rearm();
  shown.allow.focus({ preventScroll: true });
}

/** The mini panel after a selection (REQ-PICK-005). */
export function createPanel(parent: HTMLElement, deps: PanelDeps): Panel {
  const { labels } = deps;
  const trust: TrustDeps = {
    isTrusted: deps.isTrusted ?? ((event) => event.isTrusted),
    now: deps.now ?? Date.now,
  };
  const { element, move } = panelShell(deps);
  const guard = guardActivation(element, trust, () => color.sync());
  placePanel(element, move, deps, () => guard.rearm());
  const selector = selectorField(labels, deps.selector, () => update());
  const group = groupField(labels, deps.context, deps.origin);
  const chips = effectChips(labels, () => update());
  const color = colorField(labels);
  const actions = panelActions(labels);
  element.append(selector.row, group.row, chips.row, color.row, actions.row);
  if (deps.repickMarkId) {
    enterRepickMode(element, [group.row, chips.row, color.row, actions.more], labels.repickTitle);
  }

  const pick = (): SavePick => {
    const siteGroupId = group.chosen();
    return {
      selector: selector.input.value.trim(),
      ...(siteGroupId && { siteGroupId }),
      effects: chips.effects(),
      color: color.color(),
      ...(deps.repickMarkId && { repickMarkId: deps.repickMarkId }),
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
  isolate(element, trust, deps.onCancel);
  update();
  parent.append(element);
  selector.input.focus({ preventScroll: true });
  const showNotGranted = () => showNotice(element, deps, guard);
  return { element, showNotGranted, dispose: () => element.remove() };
}
