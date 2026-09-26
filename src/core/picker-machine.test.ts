import { describe, expect, it } from 'vitest';
import { type PickerEvent, type PickerState, transition } from './picker-machine';

/** Stand-ins for page elements: core only passes the handles around. */
type Target = { readonly name: string };
const button: Target = { name: 'button' };
const card: Target = { name: 'card' };
const heading: Target = { name: 'heading' };

type State = PickerState<Target>;
type Event = PickerEvent<Target>;

const idle: State = { kind: 'idle' };
const picking = (candidate: Target | null, mode: 'pointer' | 'keyboard' = 'pointer'): State => ({
  kind: 'picking',
  candidate,
  mode,
});
const editing = (selection: Target): State => ({ kind: 'editing', selection });
const cancelled: State = { kind: 'done', outcome: 'cancelled' };
const saved = (selection: Target): State => ({ kind: 'done', outcome: 'saved', selection });

const run = (state: State, ...events: Event[]): State => events.reduce(transition, state);

describe('REQ-PICK-002 picker state machine: starting and hovering', () => {
  it('starts picking with no candidate when invoked', () => {
    expect(transition(idle, { type: 'invoke' })).toEqual(picking(null));
  });

  it('follows the pointer: hovering makes the element the candidate', () => {
    expect(run(idle, { type: 'invoke' }, { type: 'hover', candidate: button })).toEqual(
      picking(button, 'pointer'),
    );
  });

  it('follows the keyboard: a resolved move makes the element the candidate', () => {
    const state = run(
      idle,
      { type: 'invoke' },
      { type: 'navigate', candidate: card },
      { type: 'navigate', candidate: heading },
    );
    expect(state).toEqual(picking(heading, 'keyboard'));
  });

  it('switches back to pointer mode when the pointer moves after keyboard moves', () => {
    const state = run(picking(card, 'keyboard'), { type: 'hover', candidate: button });
    expect(state).toEqual(picking(button, 'pointer'));
  });
});

describe('REQ-PICK-002 picker state machine: selecting', () => {
  it('Enter selects the current candidate', () => {
    expect(transition(picking(card, 'keyboard'), { type: 'select' })).toEqual(editing(card));
  });

  it('a click selects the element under it, even without a hover first', () => {
    expect(transition(picking(null), { type: 'select', candidate: button })).toEqual(
      editing(button),
    );
    expect(transition(picking(card), { type: 'select', candidate: button })).toEqual(
      editing(button),
    );
  });

  it('ignores select while there is nothing to select', () => {
    const state = picking(null);
    expect(transition(state, { type: 'select' })).toBe(state);
  });

  it('saves the selection and finishes', () => {
    expect(run(picking(button), { type: 'select' }, { type: 'save' })).toEqual(saved(button));
  });

  it('re-pick goes back to picking from the current selection', () => {
    expect(transition(editing(card), { type: 'repick' })).toEqual(picking(card, 'pointer'));
  });
});

describe('REQ-PICK-002 picker state machine: cancelling', () => {
  it.each([
    ['picking without a candidate', picking(null)],
    ['picking with a candidate', picking(button, 'keyboard')],
    ['editing', editing(card)],
  ])('Esc cancels while %s', (_name, state) => {
    expect(transition(state, { type: 'cancel' })).toEqual(cancelled);
  });

  it.each([
    ['picking', picking(button)],
    ['editing', editing(card)],
  ])('invoking the picker again while %s cancels it', (_name, state) => {
    expect(transition(state, { type: 'invoke' })).toEqual(cancelled);
  });

  it.each([
    ['cancelled', cancelled],
    ['saved', saved(button)],
  ])('invoking after the picker finished (%s) starts a new pick', (_name, state) => {
    expect(transition(state, { type: 'invoke' })).toEqual(picking(null));
  });
});

describe('REQ-PICK-002 picker state machine: events that mean nothing are ignored', () => {
  const others: Event[] = [
    { type: 'hover', candidate: button },
    { type: 'navigate', candidate: button },
    { type: 'select' },
    { type: 'select', candidate: button },
    { type: 'cancel' },
    { type: 'repick' },
    { type: 'save' },
  ];
  const ignored: [string, State, Event][] = [
    ...others.map((event): [string, State, Event] => ['idle', idle, event]),
    ...others.map((event): [string, State, Event] => ['cancelled', cancelled, event]),
    ...others.map((event): [string, State, Event] => ['saved', saved(card), event]),
    ['picking', picking(button), { type: 'repick' }],
    ['picking', picking(button), { type: 'save' }],
    ['editing', editing(card), { type: 'hover', candidate: button }],
    ['editing', editing(card), { type: 'navigate', candidate: button }],
    ['editing', editing(card), { type: 'select' }],
    ['editing', editing(card), { type: 'select', candidate: button }],
  ];

  it.each(ignored)('%s ignores %j and returns the same state', (_name, state, event) => {
    expect(transition(state, event)).toBe(state);
  });

  it('never mutates the state it is given', () => {
    const state = Object.freeze(picking(button, 'keyboard'));
    expect(() => run(state, { type: 'hover', candidate: card }, { type: 'select' })).not.toThrow();
    expect(state).toEqual(picking(button, 'keyboard'));
  });
});
