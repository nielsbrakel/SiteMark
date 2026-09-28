import { describe, expect, it } from 'vitest';
import { presetColor } from '@/core/model/presets';
import { parseSiteGroup } from '@/core/model/schema';
import { playgroundGroup } from './playground-group';
import {
  ELEMENT_EFFECTS,
  initialPlaygroundState,
  PAGE_EFFECTS,
  type PlaygroundAction,
  type PlaygroundState,
  playgroundReducer,
} from './playground-state';

const run = (...actions: PlaygroundAction[]): PlaygroundState =>
  actions.reduce(playgroundReducer, initialPlaygroundState());

describe('REQ-PLAY-001 the playground state: presets, custom hex, mark text and effects', () => {
  it('starts with a red PROD ribbon, a top banner and an outlined button', () => {
    const state = initialPlaygroundState();
    expect(state).toMatchObject({
      preset: 'red',
      color: presetColor('red'),
      hexInput: presetColor('red'),
      text: 'PROD',
      textInput: 'PROD',
      corner: 'top-right',
      edge: 'top',
      pageEffects: ['ribbon', 'banner'],
      elementEffects: ['outline'],
      errors: {},
    });
  });

  it('offers every page effect and every element effect', () => {
    expect(PAGE_EFFECTS).toEqual([
      'ribbon',
      'banner',
      'frame',
      'tint',
      'stripes',
      'watermark',
      'titlePrefix',
    ]);
    expect(ELEMENT_EFFECTS).toEqual(['outline', 'tint', 'stripes', 'ribbon']);
  });

  it.each(['amber', 'blue', 'slate'] as const)('picks the %s preset', (name) => {
    const state = run({ type: 'preset', preset: name });
    expect([state.preset, state.color, state.hexInput]).toEqual([
      name,
      presetColor(name),
      presetColor(name),
    ]);
  });

  it('turns effects on and off, keeping the catalog order', () => {
    const state = run(
      { type: 'pageEffect', effect: 'watermark', on: true },
      { type: 'pageEffect', effect: 'frame', on: true },
      { type: 'pageEffect', effect: 'banner', on: false },
      { type: 'elementEffect', effect: 'ribbon', on: true },
      { type: 'elementEffect', effect: 'tint', on: true },
      { type: 'elementEffect', effect: 'outline', on: false },
    );
    expect(state.pageEffects).toEqual(['ribbon', 'frame', 'watermark']);
    expect(state.elementEffects).toEqual(['tint', 'ribbon']);
  });

  it('moves the ribbon to another corner and the banner to the other edge', () => {
    const state = run({ type: 'corner', corner: 'bottom-left' }, { type: 'edge', edge: 'bottom' });
    expect([state.corner, state.edge]).toEqual(['bottom-left', 'bottom']);
  });

  it('builds one site group from the state: a page mark and an element mark', () => {
    const group = playgroundGroup(
      run({ type: 'pageEffect', effect: 'titlePrefix', on: true }, { type: 'text', text: 'LIVE' }),
    );
    const [page, element] = group.marks;
    expect(group.enabled).toBe(true);
    expect(page?.target).toEqual({ kind: 'page' });
    expect(page?.effects).toMatchObject({
      ribbon: { text: 'LIVE', corner: 'top-right' },
      banner: { text: 'LIVE', edge: 'top' },
      titlePrefix: { text: 'LIVE' },
    });
    expect(element?.target.kind).toBe('element');
    expect(Object.keys(element?.effects ?? {})).toEqual(['outline']);
  });

  it('leaves out a mark without effects', () => {
    const noPage = run(
      { type: 'pageEffect', effect: 'ribbon', on: false },
      { type: 'pageEffect', effect: 'banner', on: false },
    );
    expect(playgroundGroup(noPage).marks.map((mark) => mark.target.kind)).toEqual(['element']);
    const noElement = run({ type: 'elementEffect', effect: 'outline', on: false });
    expect(playgroundGroup(noElement).marks.map((mark) => mark.target.kind)).toEqual(['page']);
  });

  it('always builds a site group that the core schema accepts, whatever the controls say', () => {
    const everything = run(
      ...PAGE_EFFECTS.map((effect) => ({ type: 'pageEffect', effect, on: true }) as const),
      ...ELEMENT_EFFECTS.map((effect) => ({ type: 'elementEffect', effect, on: true }) as const),
      { type: 'hex', text: '#ABCDEF' },
      { type: 'text', text: '  Staging  ' },
    );
    for (const state of [initialPlaygroundState(), everything]) {
      expect(parseSiteGroup(playgroundGroup(state)).ok).toBe(true);
    }
  });
});

describe('REQ-PLAY-006 custom input is validated with the core schemas', () => {
  it.each([
    ['#1F6FEB', '#1f6feb'],
    ['1f6feb', '#1f6feb'],
    [' #00ff88 ', '#00ff88'],
  ])('accepts the custom color %s as %s', (text, color) => {
    const state = run({ type: 'hex', text });
    expect(state).toMatchObject({ preset: 'custom', color, hexInput: text, errors: {} });
  });

  it.each(['blue', '#12345', '#1234567', '#gggggg', ''])('refuses the color "%s"', (text) => {
    const state = run({ type: 'hex', text });
    expect(state.errors).toEqual({ hex: 'optionsHexInvalid' });
    // The preview keeps the last valid color while the field shows the error.
    expect([state.preset, state.color, state.hexInput]).toEqual([
      'custom',
      presetColor('red'),
      text,
    ]);
  });

  it('forgets a color error when a preset is picked', () => {
    const state = run({ type: 'hex', text: 'nope' }, { type: 'preset', preset: 'blue' });
    expect(state.errors).toEqual({});
    expect(state.hexInput).toBe(presetColor('blue'));
  });

  it('starts Custom from the color in the hex field', () => {
    const state = run(
      { type: 'hex', text: '#00ff88' },
      { type: 'preset', preset: 'blue' },
      { type: 'preset', preset: 'custom' },
    );
    expect([state.preset, state.color, state.hexInput]).toEqual([
      'custom',
      presetColor('blue'),
      presetColor('blue'),
    ]);
  });

  it('cleans the mark text like the schema does', () => {
    expect(run({ type: 'text', text: '  TEST​  ' })).toMatchObject({
      text: 'TEST',
      errors: {},
    });
  });

  it.each(['', '   ', '​‮'])('refuses an empty mark text ("%s")', (text) => {
    const state = run({ type: 'text', text });
    expect(state.errors).toEqual({ text: 'optionsTextRequired' });
    expect([state.text, state.textInput]).toEqual(['PROD', text]);
  });

  it('keeps the mark text within the ribbon limit of 16 characters', () => {
    const state = run({ type: 'text', text: 'A very long mark text' });
    expect(state.text).toBe('A very long mark');
    expect(state.errors).toEqual({});
  });
});
