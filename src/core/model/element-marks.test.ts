import { describe, expect, it } from 'vitest';
import { anElementMark, aPageMark, aSiteGroup, aState } from '../testing/builders';
import { messagesOf, okValue, pathsOf, untrusted } from '../testing/schema-results';
import {
  type ElementEffects,
  type PageEffects,
  parseMark,
  parseSiteGroup,
  parseState,
} from './schema';

/** An element mark with exactly these effects (possibly invalid ones). */
const withEffects = (effects: unknown): unknown => ({ ...anElementMark(), effects });

/** Parses an element mark whose only effect is `name: value`. */
const parseEffect = (name: string, value: unknown) => parseMark(withEffects({ [name]: value }));

const outline = { widthPx: 2, style: 'solid', pulse: false };

describe('REQ-MARK-001 an element mark targets a CSS selector of 1..500 characters', () => {
  it('accepts what the builder produces', () => {
    const mark = anElementMark();
    expect(okValue(parseMark(untrusted(mark)))).toEqual(mark);
  });

  it('keeps the selector as written', () => {
    const target = { kind: 'element', selector: 'main > .card:nth-child(2) [data-env="prod"]' };
    expect(okValue(parseMark({ ...anElementMark(), target })).target).toEqual(target);
  });

  it.each([
    ['', ['target.selector']],
    ['x'.repeat(500), []],
    ['x'.repeat(501), ['target.selector']],
    [undefined, ['target.selector']],
    [42, ['target.selector']],
  ])('selector %j → issues at %j', (selector, paths) => {
    const target = { kind: 'element', selector };
    expect(pathsOf(parseMark({ ...anElementMark(), target }))).toEqual(paths);
  });

  it('rejects an unknown key on the target', () => {
    const target = { kind: 'element', selector: '#app', frame: 0 };
    expect(pathsOf(parseMark({ ...anElementMark(), target }))).toEqual(['target']);
  });

  it('stores colors lowercase', () => {
    const parsed = okValue(
      parseMark({ ...anElementMark(), color: '#1F6FEB', textColor: '#FFF000' }),
    );
    expect([parsed.color, parsed.textColor]).toEqual(['#1f6feb', '#fff000']);
  });

  it('needs at least one effect', () => {
    const result = parseMark(withEffects({}));
    expect(pathsOf(result)).toEqual(['effects']);
    expect(messagesOf(result)[0]).toMatch(/effect/i);
  });

  it('accepts every element effect at once', () => {
    const effects = {
      ribbon: { text: 'PROD', corner: 'bottom-left' },
      outline: { widthPx: 3, style: 'dashed', pulse: true },
      tint: { opacityPct: 25 },
      stripes: { opacityPct: 30 },
    };
    expect(okValue(parseMark(withEffects(effects))).effects).toEqual(effects);
  });

  it('reports element mark issues with their path in the state', () => {
    const bad = { ...anElementMark(), effects: { outline: { ...outline, widthPx: 20 } } };
    const group = { ...aSiteGroup(), marks: [aPageMark(), anElementMark(), bad] };
    expect(pathsOf(parseState({ ...aState(), siteGroups: [group] }))).toEqual([
      'siteGroups[0].marks[2].effects.outline.widthPx',
    ]);
    expect(parseSiteGroup(aSiteGroup({ marks: [aPageMark(), anElementMark()] })).ok).toBe(true);
  });
});

describe('REQ-MARK-002 element ribbon: 1..16 characters in a corner', () => {
  it.each(['top-left', 'top-right', 'bottom-left', 'bottom-right'])('accepts %s', (corner) => {
    expect(parseEffect('ribbon', { text: 'PROD', corner }).ok).toBe(true);
  });

  it.each([
    [{ text: 'x'.repeat(16), corner: 'top-left' }, []],
    [{ text: 'x'.repeat(17), corner: 'top-left' }, ['effects.ribbon.text']],
    [{ text: ' ', corner: 'top-left' }, ['effects.ribbon.text']],
    [{ text: 'PROD', corner: 'middle' }, ['effects.ribbon.corner']],
  ])('%j → issues at %j', (ribbon, paths) => {
    expect(pathsOf(parseEffect('ribbon', ribbon))).toEqual(paths);
  });
});

describe('REQ-MARK-003 outline: 1..8 px, solid, dashed or dotted, with an optional pulse', () => {
  it.each([
    [1, 'solid', false],
    [8, 'dashed', true],
    [4, 'dotted', false],
  ])('accepts %i px %s, pulse %s', (widthPx, style, pulse) => {
    expect(parseEffect('outline', { widthPx, style, pulse }).ok).toBe(true);
  });

  it.each([
    [{ ...outline, widthPx: 0 }, ['effects.outline.widthPx']],
    [{ ...outline, widthPx: 9 }, ['effects.outline.widthPx']],
    [{ ...outline, widthPx: 1.5 }, ['effects.outline.widthPx']],
    [{ ...outline, style: 'double' }, ['effects.outline.style']],
    [{ ...outline, pulse: 'yes' }, ['effects.outline.pulse']],
    [{ widthPx: 2, style: 'solid' }, ['effects.outline.pulse']],
  ])('%j → issues at %j', (value, paths) => {
    expect(pathsOf(parseEffect('outline', value))).toEqual(paths);
  });
});

describe('REQ-MARK-004 element tint: 5..40 %', () => {
  it.each([
    [5, true],
    [20, true],
    [40, true],
    [4, false],
    [41, false],
  ])('%j percent → %s', (opacityPct, valid) => {
    expect(parseEffect('tint', { opacityPct }).ok).toBe(valid);
  });

  it('uses its own range, not the page range (3..15 %)', () => {
    expect(parseEffect('tint', { opacityPct: 20 }).ok).toBe(true);
    const page = parseMark({ ...aPageMark(), effects: { tint: { opacityPct: 20 } } });
    expect(pathsOf(page)).toEqual(['effects.tint.opacityPct']);
  });
});

describe('REQ-MARK-007 element stripes: 5..40 % over the element box', () => {
  it.each([
    [{ opacityPct: 5 }, []],
    [{ opacityPct: 40 }, []],
    [{ opacityPct: 4 }, ['effects.stripes.opacityPct']],
    [{ opacityPct: 41 }, ['effects.stripes.opacityPct']],
    [{ opacityPct: 20, area: 'full' }, ['effects.stripes']],
  ])('%j → issues at %j', (stripes, paths) => {
    expect(pathsOf(parseEffect('stripes', stripes))).toEqual(paths);
  });
});

describe('REQ-MARK-014 effects that fit one target type are enforced by type and schema', () => {
  it.each([
    ['banner', { text: 'Production', edge: 'top', size: 'compact' }],
    ['frame', { widthPx: 4 }],
    ['watermark', { text: 'PROD', opacityPct: 6 }],
    ['titlePrefix', { text: '[PROD]' }],
    ['favicon', {}],
  ])('rejects the page-only %s on an element mark', (name, value) => {
    const result = parseMark(withEffects({ outline, [name]: value }));
    expect(pathsOf(result)).toEqual(['effects']);
    expect(messagesOf(result).join()).toContain(name);
  });

  it('rejects an outline on a page mark', () => {
    const result = parseMark({
      ...aPageMark(),
      effects: { ribbon: { text: 'P', corner: 'top-left' }, outline },
    });
    expect(pathsOf(result)).toEqual(['effects']);
    expect(messagesOf(result).join()).toContain('outline');
  });

  it('rejects page stripes settings on an element and element-only settings on a page', () => {
    expect(pathsOf(parseEffect('stripes', { opacityPct: 10, area: 'edge' }))).toEqual([
      'effects.stripes',
    ]);
    const page = parseMark({ ...aPageMark(), effects: { stripes: { opacityPct: 10 } } });
    expect(pathsOf(page)).toEqual(['effects.stripes.area']);
  });

  it('keeps page-only effects off element marks at compile time', () => {
    const element: ElementEffects = {
      // @ts-expect-error banner is a page-only effect
      banner: { text: 'Production', edge: 'top', size: 'compact' },
    };
    const page: PageEffects = {
      // @ts-expect-error outline is an element-only effect
      outline: { widthPx: 2, style: 'solid', pulse: false },
    };
    expect([element, page]).toHaveLength(2);
  });
});
