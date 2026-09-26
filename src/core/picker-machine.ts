import { assertNever } from './result';

/** How the current candidate was reached: the pointer, or ↑ ↓ ← → from the keyboard (REQ-PICK-002). */
export type PickerMode = 'pointer' | 'keyboard';

/**
 * The picker's state (plan §3.4). `C` is an opaque handle for a page element; core never looks inside
 * it (the content script uses `Element`). A handle is never `null` or `undefined`.
 */
export type PickerState<C extends NonNullable<unknown>> =
  | { readonly kind: 'idle' }
  | { readonly kind: 'picking'; readonly candidate: C | null; readonly mode: PickerMode }
  | { readonly kind: 'editing'; readonly selection: C }
  | { readonly kind: 'done'; readonly outcome: 'cancelled' }
  | { readonly kind: 'done'; readonly outcome: 'saved'; readonly selection: C };

/**
 * Inputs to the picker. The DOM layer turns trusted page input into these: it finds the element under
 * the pointer, and it resolves keyboard moves (parent, first child, siblings, or the starting element)
 * into the candidate for `navigate`.
 */
export type PickerEvent<C extends NonNullable<unknown>> =
  /** The popup's "Pick element" or the `start-picker` command. Cancels a picker that is already active. */
  | { readonly type: 'invoke' }
  | { readonly type: 'hover'; readonly candidate: C }
  | { readonly type: 'navigate'; readonly candidate: C }
  /** A click (with the element under it) or Enter (the current candidate). */
  | { readonly type: 'select'; readonly candidate?: C }
  /** Esc, the panel's Cancel, or the page going away. */
  | { readonly type: 'cancel' }
  /** Back from the mini panel to picking, starting from the current selection. */
  | { readonly type: 'repick' }
  | { readonly type: 'save' };

/**
 * The picker's only state change (REQ-PICK-002). Pure: it returns a new state, or the same object when
 * the event means nothing in the current state.
 */
export function transition<C extends NonNullable<unknown>>(
  state: PickerState<C>,
  event: PickerEvent<C>,
): PickerState<C> {
  switch (state.kind) {
    case 'idle':
    case 'done':
      return event.type === 'invoke'
        ? { kind: 'picking', candidate: null, mode: 'pointer' }
        : state;
    case 'picking':
      return fromPicking(state, event);
    case 'editing':
      return fromEditing(state, event);
    default:
      return assertNever(state);
  }
}

type Picking<C extends NonNullable<unknown>> = Extract<PickerState<C>, { kind: 'picking' }>;
type Editing<C extends NonNullable<unknown>> = Extract<PickerState<C>, { kind: 'editing' }>;

const CANCELLED = { kind: 'done', outcome: 'cancelled' } as const;

function fromPicking<C extends NonNullable<unknown>>(
  state: Picking<C>,
  event: PickerEvent<C>,
): PickerState<C> {
  switch (event.type) {
    case 'invoke':
    case 'cancel':
      return CANCELLED;
    case 'hover':
      return { kind: 'picking', candidate: event.candidate, mode: 'pointer' };
    case 'navigate':
      return { kind: 'picking', candidate: event.candidate, mode: 'keyboard' };
    case 'select': {
      const selection = event.candidate ?? state.candidate;
      return selection === null ? state : { kind: 'editing', selection };
    }
    case 'repick':
    case 'save':
      return state;
    default:
      return assertNever(event);
  }
}

function fromEditing<C extends NonNullable<unknown>>(
  state: Editing<C>,
  event: PickerEvent<C>,
): PickerState<C> {
  switch (event.type) {
    case 'invoke':
    case 'cancel':
      return CANCELLED;
    case 'save':
      return { kind: 'done', outcome: 'saved', selection: state.selection };
    case 'repick':
      return { kind: 'picking', candidate: state.selection, mode: 'pointer' };
    case 'hover':
    case 'navigate':
    case 'select':
      return state;
    default:
      return assertNever(event);
  }
}
