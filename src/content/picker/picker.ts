import { type PickerEvent, type PickerState, transition } from '../../core/picker-machine';
import { assertNever } from '../../core/result';
import type { GlassPane, PaneHooks } from './glass-pane';
import { navigate, startElement } from './keyboard-nav';
import type { PaneKey } from './pane-focus';

// The picker session (plan §3.4, REQ-PICK-002): trusted input from the glass pane becomes picker
// events, core's pure `transition` decides, and this file only shows the resulting state. The
// selection is handed over to the panel (`onSelect`); the session ends on Esc, Cancel or Save.

type State = PickerState<Element>;
type Event = PickerEvent<Element>;

export type PickerDeps = {
  readonly createPane: (hooks: PaneHooks) => GlassPane;
  /** The user selected an element: the mini panel takes over in `root` (REQ-PICK-005). */
  readonly onSelect: (element: Element, session: PickerSession, root: HTMLElement) => void;
  /** The session ended (cancelled or saved); the pane is already gone. */
  readonly onEnd: () => void;
};

export type PickerSession = {
  /** Feeds an event to the state machine, e.g. `cancel` or `save` from the panel. */
  dispatch(event: Event): void;
  /** The current state (read-only). */
  state(): State;
};

/** Starts picking: the pane covers the page until the pick ends. */
export function runPicker(deps: PickerDeps): PickerSession {
  // Read before the pane takes the focus (REQ-PICK-002: keyboard picking starts there).
  const start = startElement() ?? document.body;
  let state: State = transition<Element>({ kind: 'idle' }, { type: 'invoke' });
  const session: PickerSession = { dispatch: (event) => apply(event), state: () => state };
  const onKey = (key: PaneKey) => {
    const event = keyEvent(key, state, start);
    if (event) apply(event);
  };
  const pane = deps.createPane({
    onHover: (candidate) => apply({ type: 'hover', candidate }),
    onSelect: (candidate) => apply({ type: 'select', candidate }),
    onKey,
  });

  function apply(event: Event): void {
    const next = transition(state, event);
    if (next === state) return;
    state = next;
    show(next);
  }

  function show(next: State): void {
    switch (next.kind) {
      case 'idle':
        return;
      case 'picking':
        pane.highlight(next.candidate);
        return;
      case 'editing':
        pane.highlight(next.selection);
        deps.onSelect(next.selection, session, pane.root);
        return;
      case 'done':
        pane.dispose();
        deps.onEnd();
        return;
      default:
        assertNever(next);
    }
  }

  return session;
}

/** Enter selects, Esc cancels, arrows move from the candidate (or from where picking started). */
function keyEvent(key: PaneKey, state: State, start: Element): Event | undefined {
  if (key === 'escape') return { type: 'cancel' };
  if (state.kind !== 'picking') return undefined;
  const from = state.candidate ?? start;
  if (key === 'enter') return { type: 'select', candidate: from };
  return { type: 'navigate', candidate: navigate(from, key) };
}
