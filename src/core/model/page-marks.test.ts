import { describe, expect, it } from 'vitest';
import { aMark, aPageMark, aSiteGroup, aState } from '../testing/builders';
import { messagesOf, okValue, pathsOf, times, untrusted } from '../testing/schema-results';
import { parseMark, parseSiteGroup, parseState } from './schema';

/** A page mark with exactly these effects (possibly invalid ones). */
const withEffects = (effects: unknown): unknown => ({ ...aPageMark(), effects });

/** Parses a page mark whose only effect is `name: value`. */
const parseEffect = (name: string, value: unknown) => parseMark(withEffects({ [name]: value }));

describe('REQ-MARK-001 a page mark has a color, a text color and at least one effect', () => {
  it('accepts what the builders produce', () => {
    const mark = aPageMark();
    expect(okValue(parseMark(untrusted(mark)))).toEqual(mark);
    expect(parseMark(aMark()).ok).toBe(true);
  });

  it('stores colors lowercase', () => {
    const mark = { ...aPageMark(), color: '#C93A2E', textColor: '#FFFFFF' };
    const parsed = okValue(parseMark(mark));
    expect(parsed.color).toBe('#c93a2e');
    expect(parsed.textColor).toBe('#ffffff');
    expect(okValue(parseMark({ ...aPageMark(), textColor: 'auto' })).textColor).toBe('auto');
  });

  it.each([
    ['color', 'red'],
    ['color', '#fff'],
    ['textColor', 'white'],
    ['textColor', 'AUTO'],
    ['enabled', 'yes'],
    ['id', 'too-short'],
  ])('rejects %s = %j', (key, value) => {
    expect(pathsOf(parseMark({ ...aPageMark(), [key]: value }))).toEqual([key]);
  });

  it('has an optional label of at most 40 characters, cleaned like all user text', () => {
    const { label: _, ...unlabelled } = aPageMark({ label: 'x' });
    expect(parseMark(unlabelled).ok).toBe(true);
    expect(okValue(parseMark(aPageMark({ label: ' Main\u202E ' }))).label).toBe('Main');
    expect(parseMark(aPageMark({ label: 'x'.repeat(40) })).ok).toBe(true);
    expect(pathsOf(parseMark(aPageMark({ label: 'x'.repeat(41) })))).toEqual(['label']);
  });

  it('needs at least one effect', () => {
    const result = parseMark(withEffects({}));
    expect(pathsOf(result)).toEqual(['effects']);
    expect(messagesOf(result)[0]).toMatch(/effect/i);
  });

  it.each([
    ['an unknown key on the mark', () => ({ ...aPageMark(), extra: 1 }), ''],
    ['an unknown effect', () => withEffects({ confetti: {} }), 'effects'],
    ['an unknown target', () => ({ ...aPageMark(), target: { kind: 'window' } }), 'target.kind'],
    [
      'a selector on a page target',
      () => ({ ...aPageMark(), target: { kind: 'page', selector: 'a' } }),
      'target',
    ],
    [
      'an unknown key on an effect',
      () => withEffects({ frame: { widthPx: 4, color: 'red' } }),
      'effects.frame',
    ],
  ])('rejects %s', (_what, mark, path) => {
    expect(pathsOf(parseMark(mark()))).toEqual([path]);
  });

  it('accepts every page effect at once', () => {
    const effects = {
      ribbon: { text: 'PROD', corner: 'top-left' },
      banner: { text: 'Production', edge: 'bottom', size: 'regular' },
      frame: { widthPx: 4 },
      tint: { opacityPct: 8 },
      stripes: { opacityPct: 20, area: 'full' },
      watermark: { text: 'PRODUCTION', opacityPct: 6 },
      titlePrefix: { text: '[PROD]' },
      favicon: {},
    };
    expect(okValue(parseMark(withEffects(effects))).effects).toEqual(effects);
  });
});

describe('REQ-MARK-015 ribbon and banner text is mandatory and non-empty', () => {
  it.each(['', '   ', '\u202E\u200B'])('rejects the ribbon text %j', (text) => {
    const result = parseEffect('ribbon', { text, corner: 'top-right' });
    expect(pathsOf(result)).toEqual(['effects.ribbon.text']);
  });

  it.each(['', '  ', '\u2066\u2069'])('rejects the banner text %j', (text) => {
    const result = parseEffect('banner', { text, edge: 'top', size: 'compact' });
    expect(pathsOf(result)).toEqual(['effects.banner.text']);
  });

  it('rejects a ribbon or banner without text', () => {
    expect(pathsOf(parseEffect('ribbon', { corner: 'top-right' }))).toEqual([
      'effects.ribbon.text',
    ]);
    expect(pathsOf(parseEffect('banner', { edge: 'top', size: 'compact' }))).toEqual([
      'effects.banner.text',
    ]);
  });
});

describe('REQ-MARK-002 page ribbon: 1..16 characters in a corner', () => {
  it.each(['top-left', 'top-right', 'bottom-left', 'bottom-right'])('accepts %s', (corner) => {
    expect(parseEffect('ribbon', { text: 'PROD', corner }).ok).toBe(true);
  });

  it('allows 16 characters, not 17, and rejects other corners', () => {
    expect(parseEffect('ribbon', { text: 'x'.repeat(16), corner: 'top-left' }).ok).toBe(true);
    const long = parseEffect('ribbon', { text: 'x'.repeat(17), corner: 'top-left' });
    expect(pathsOf(long)).toEqual(['effects.ribbon.text']);
    const center = parseEffect('ribbon', { text: 'PROD', corner: 'center' });
    expect(pathsOf(center)).toEqual(['effects.ribbon.corner']);
  });

  it('cleans the text', () => {
    const mark = parseEffect('ribbon', { text: '\u202EPROD ', corner: 'top-left' });
    expect(okValue(mark).effects).toEqual({ ribbon: { text: 'PROD', corner: 'top-left' } });
  });
});

describe('REQ-MARK-005 banner: 1..60 characters on the top or bottom edge, compact or regular', () => {
  it.each([
    ['top', 'compact'],
    ['top', 'regular'],
    ['bottom', 'compact'],
    ['bottom', 'regular'],
  ])('accepts edge %s, size %s', (edge, size) => {
    expect(parseEffect('banner', { text: 'Production', edge, size }).ok).toBe(true);
  });

  it.each([
    [{ text: 'x'.repeat(60), edge: 'top', size: 'compact' }, []],
    [{ text: 'x'.repeat(61), edge: 'top', size: 'compact' }, ['effects.banner.text']],
    [{ text: 'Prod', edge: 'left', size: 'compact' }, ['effects.banner.edge']],
    [{ text: 'Prod', edge: 'top', size: 'large' }, ['effects.banner.size']],
    [{ text: 'Prod', edge: 'top' }, ['effects.banner.size']],
  ])('%j → issues at %j', (banner, paths) => {
    expect(pathsOf(parseEffect('banner', banner))).toEqual(paths);
  });
});

describe('REQ-MARK-006 frame: 2..16 px', () => {
  it.each([2, 9, 16])('accepts %i px', (widthPx) => {
    expect(parseEffect('frame', { widthPx }).ok).toBe(true);
  });

  it.each([1, 17, 2.5, '4', null])('rejects %j', (widthPx) => {
    expect(pathsOf(parseEffect('frame', { widthPx }))).toEqual(['effects.frame.widthPx']);
  });
});

describe('REQ-MARK-004 page tint: 3..15 %', () => {
  it.each([
    [3, true],
    [15, true],
    [2, false],
    [16, false],
    [7.5, false],
  ])('%j percent → %s', (opacityPct, valid) => {
    expect(parseEffect('tint', { opacityPct }).ok).toBe(valid);
  });
});

describe('REQ-MARK-007 page stripes: 5..40 %, along the edge or full', () => {
  it.each([
    [{ opacityPct: 5, area: 'edge' }, []],
    [{ opacityPct: 40, area: 'full' }, []],
    [{ opacityPct: 4, area: 'edge' }, ['effects.stripes.opacityPct']],
    [{ opacityPct: 41, area: 'edge' }, ['effects.stripes.opacityPct']],
    [{ opacityPct: 20, area: 'corner' }, ['effects.stripes.area']],
    [{ opacityPct: 20 }, ['effects.stripes.area']],
  ])('%j → issues at %j', (stripes, paths) => {
    expect(pathsOf(parseEffect('stripes', stripes))).toEqual(paths);
  });
});

describe('REQ-MARK-008 watermark: 1..24 characters at 4..12 %', () => {
  it.each([
    [{ text: 'PROD', opacityPct: 4 }, []],
    [{ text: 'x'.repeat(24), opacityPct: 12 }, []],
    [{ text: 'x'.repeat(25), opacityPct: 8 }, ['effects.watermark.text']],
    [{ text: ' \u200B ', opacityPct: 8 }, ['effects.watermark.text']],
    [{ text: 'PROD', opacityPct: 3 }, ['effects.watermark.opacityPct']],
    [{ text: 'PROD', opacityPct: 13 }, ['effects.watermark.opacityPct']],
  ])('%j → issues at %j', (watermark, paths) => {
    expect(pathsOf(parseEffect('watermark', watermark))).toEqual(paths);
  });
});

describe('REQ-MARK-009 title prefix: 1..16 characters, opt-in', () => {
  it.each([
    [{ text: '[PROD]' }, []],
    [{ text: 'x'.repeat(16) }, []],
    [{ text: 'x'.repeat(17) }, ['effects.titlePrefix.text']],
    [{ text: '\u202E' }, ['effects.titlePrefix.text']],
    [{}, ['effects.titlePrefix.text']],
  ])('%j → issues at %j', (titlePrefix, paths) => {
    expect(pathsOf(parseEffect('titlePrefix', titlePrefix))).toEqual(paths);
  });

  it('is off unless the mark lists it', () => {
    expect(okValue(parseMark(aPageMark())).effects).not.toHaveProperty('titlePrefix');
  });
});

describe('REQ-MARK-010 favicon tint: on when present, with no settings', () => {
  it('accepts an empty object', () => {
    expect(okValue(parseEffect('favicon', {})).effects).toEqual({ favicon: {} });
  });

  it.each([true, { color: '#ff0000' }, null])('rejects %j', (favicon) => {
    expect(pathsOf(parseEffect('favicon', favicon))).toEqual(['effects.favicon']);
  });
});

describe('REQ-GRP-002 a site group holds 0..50 marks', () => {
  it('accepts marks in a site group and reports their paths inside the state', () => {
    expect(parseSiteGroup(aSiteGroup({ marks: [aPageMark(), aMark()] })).ok).toBe(true);
    const bad = { ...aPageMark(), effects: { ribbon: { text: '', corner: 'top-left' } } };
    const group = { ...aSiteGroup(), marks: [aPageMark(), bad] };
    expect(pathsOf(parseState({ ...aState(), siteGroups: [aSiteGroup(), group] }))).toEqual([
      'siteGroups[1].marks[1].effects.ribbon.text',
    ]);
  });

  it('allows 50 marks, not 51', () => {
    const marks = times(50, () => aPageMark());
    expect(parseSiteGroup(aSiteGroup({ marks })).ok).toBe(true);
    expect(pathsOf(parseSiteGroup(aSiteGroup({ marks: [...marks, aPageMark()] })))).toEqual([
      'marks',
    ]);
  });

  it('rejects a mark ID used in two site groups', () => {
    const mark = aPageMark();
    const groups = [aSiteGroup({ marks: [mark] }), aSiteGroup({ marks: [mark] })];
    expect(pathsOf(parseState(aState({ siteGroups: groups })))).toEqual([
      'siteGroups[1].marks[0].id',
    ]);
  });
});
