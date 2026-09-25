import { describe, expect, it } from 'vitest';
import { autoTextColor } from '../model/color';
import type { Hex, Mark, PageEffects, SiteGroup } from '../model/schema';
import {
  anElementMark,
  aPageMark,
  aSiteGroup,
  aState,
  aWildcardPattern,
} from '../testing/builders';
import { compose } from './compose';
import { emptyPlan, type RenderItem } from './render-plan';

const PAGE_URL = 'https://app.example.com/admin';
const RED = '#c93a2e' as Hex;
const BLUE = '#1f6feb' as Hex;
const AMBER = '#f4a300' as Hex;

const page = (effects: PageEffects, color = RED) => aPageMark({ effects, color });
const group = (marks: Mark[], overrides: Partial<SiteGroup> = {}) =>
  aSiteGroup({ patterns: [aWildcardPattern({ value: '*.example.com' })], marks, ...overrides });
const planFor = (...groups: SiteGroup[]) => compose(PAGE_URL, aState({ siteGroups: groups })).items;
const keys = (items: readonly RenderItem[]) => items.map((item) => item.key);
const ofEffect = (items: readonly RenderItem[], effect: RenderItem['effect']) =>
  items.filter((item) => item.effect === effect);

describe('REQ-GRP-005 compose: every active group applies', () => {
  it('is empty when no group is active', () => {
    const ribbon = page({ ribbon: { text: 'PROD', corner: 'top-right' } });
    expect(emptyPlan()).toEqual({ items: [] });
    expect(compose(PAGE_URL, aState({ siteGroups: [] }))).toEqual(emptyPlan());
    expect(planFor(group([ribbon], { enabled: false }))).toEqual([]);
    expect(compose('https://other.org/', aState({ siteGroups: [group([ribbon])] })).items).toEqual(
      [],
    );
    const excluded = group([ribbon], { excludes: [aWildcardPattern({ value: PAGE_URL })] });
    expect(planFor(excluded)).toEqual([]);
  });

  it('skips disabled marks', () => {
    const off = aPageMark({ enabled: false });
    const on = aPageMark();
    expect(planFor(group([off, on])).map((item) => item.markIds)).toEqual([[on.id]]);
  });

  it('describes one page ribbon with resolved colors', () => {
    const mark = aPageMark({ effects: { ribbon: { text: 'PROD', corner: 'top-left' } } });
    expect(planFor(group([mark]))).toEqual([
      {
        key: `${mark.id}:ribbon`,
        markIds: [mark.id],
        effect: 'ribbon',
        target: 'page',
        color: RED,
        textColor: autoTextColor(RED),
        z: 0,
        params: { text: 'PROD', corner: 'top-left' },
      },
    ]);
    const fixed = aPageMark({ textColor: '#123456' as Hex });
    expect(planFor(group([fixed]))[0]?.textColor).toBe('#123456');
  });

  it('merges banners per edge: texts joined with " · ", first banner color and size', () => {
    const a = page({ banner: { text: 'PROD', edge: 'top', size: 'regular' } }, RED);
    const b = page({ banner: { text: 'EU', edge: 'top', size: 'compact' } }, BLUE);
    const c = page({ banner: { text: 'Read only', edge: 'bottom', size: 'compact' } }, AMBER);
    const items = planFor(group([a]), group([c, b]));
    // Each merged banner stacks by its first (highest-priority) mark: the top one is on top.
    expect(ofEffect(items, 'banner')).toEqual([
      expect.objectContaining({
        key: 'banner:bottom',
        markIds: [c.id],
        color: AMBER,
        params: { text: 'Read only', edge: 'bottom', size: 'compact' },
      }),
      expect.objectContaining({
        key: 'banner:top',
        markIds: [a.id, b.id],
        color: RED,
        params: { text: 'PROD · EU', edge: 'top', size: 'regular' },
      }),
    ]);
  });

  it('nests frames: the highest priority is outermost', () => {
    const outer = page({ frame: { widthPx: 4 } });
    const middle = page({ frame: { widthPx: 6 } });
    const inner = page({ frame: { widthPx: 2 } });
    const frames = ofEffect(planFor(group([outer]), group([middle, inner])), 'frame');
    const byMark = (id: string) => frames.find((item) => item.markIds[0] === id)?.params;
    expect(byMark(outer.id)).toEqual({ widthPx: 4, nesting: 0, insetPx: 0 });
    expect(byMark(middle.id)).toEqual({ widthPx: 6, nesting: 1, insetPx: 4 });
    expect(byMark(inner.id)).toEqual({ widthPx: 2, nesting: 2, insetPx: 10 });
  });

  it('gives each page ribbon corner to the highest priority', () => {
    const first = page({ ribbon: { text: 'PROD', corner: 'top-right' } });
    const second = page({ ribbon: { text: 'EU', corner: 'top-right' } });
    const third = page({ ribbon: { text: 'OPS', corner: 'bottom-left' } });
    const ribbons = ofEffect(planFor(group([first]), group([second, third])), 'ribbon');
    expect(ribbons.map((item) => item.markIds[0]).sort()).toEqual([first.id, third.id].sort());
  });

  it('renders every tint, stripes and watermark, the higher priority on top', () => {
    const high = page({ tint: { opacityPct: 5 }, stripes: { opacityPct: 10, area: 'edge' } });
    const low = page({ tint: { opacityPct: 9 }, watermark: { text: 'PROD', opacityPct: 6 } });
    const items = planFor(group([high]), group([low]));
    expect(keys(ofEffect(items, 'tint'))).toEqual([`${low.id}:tint`, `${high.id}:tint`]);
    expect(ofEffect(items, 'stripes')).toHaveLength(1);
    expect(ofEffect(items, 'watermark')).toHaveLength(1);
  });

  it('keeps only the highest-priority title prefix and favicon', () => {
    const high = page({ titlePrefix: { text: '[PROD]' } }, RED);
    const low = page({ titlePrefix: { text: '[EU]' }, favicon: {} }, BLUE);
    const lowest = page({ favicon: {} }, AMBER);
    const items = planFor(group([high, low]), group([lowest]));
    expect(ofEffect(items, 'titlePrefix')).toEqual([
      expect.objectContaining({ markIds: [high.id], params: { text: '[PROD]' } }),
    ]);
    expect(ofEffect(items, 'favicon')).toEqual([
      expect.objectContaining({ markIds: [low.id], color: BLUE, params: {} }),
    ]);
  });

  it('renders every element mark independently, one item per effect', () => {
    const outlined = anElementMark({
      target: { kind: 'element', selector: '#save' },
      effects: {
        outline: { widthPx: 2, style: 'dashed', pulse: true },
        ribbon: { text: 'LIVE', corner: 'top-left' },
      },
    });
    const tinted = anElementMark({
      target: { kind: 'element', selector: '#save' },
      effects: { tint: { opacityPct: 20 }, stripes: { opacityPct: 30 } },
    });
    const items = planFor(group([outlined]), group([tinted]));
    expect(items).toHaveLength(4);
    expect(items.every((item) => item.target !== 'page' && item.target.selector === '#save')).toBe(
      true,
    );
    expect(items.find((item) => item.key === `${outlined.id}:outline`)?.params).toEqual({
      widthPx: 2,
      style: 'dashed',
      pulse: true,
    });
    expect(keys(items)).toEqual(
      expect.arrayContaining([
        `${tinted.id}:tint`,
        `${tinted.id}:stripes`,
        `${outlined.id}:ribbon`,
      ]),
    );
  });

  it('stacks bottom → top: frame < stripes < watermark < tint < element < banner < ribbon', () => {
    const everything = page({
      ribbon: { text: 'PROD', corner: 'top-right' },
      banner: { text: 'Production', edge: 'top', size: 'compact' },
      tint: { opacityPct: 5 },
      watermark: { text: 'PROD', opacityPct: 6 },
      stripes: { opacityPct: 10, area: 'full' },
      frame: { widthPx: 4 },
      titlePrefix: { text: '[P]' },
      favicon: {},
    });
    const items = planFor(group([everything, anElementMark()]));
    const painted = items.filter((i) => i.effect !== 'titlePrefix' && i.effect !== 'favicon');
    expect(painted.map((item) => item.effect)).toEqual([
      'frame',
      'stripes',
      'watermark',
      'tint',
      'outline',
      'banner',
      'ribbon',
    ]);
    expect(items.map((item) => item.z)).toEqual(items.map((_, index) => index));
  });

  it('orders by group priority, then by mark order within the group', () => {
    const [a, b, c] = [5, 7, 9].map((opacityPct) => page({ tint: { opacityPct } }));
    if (!(a && b && c)) throw new Error('marks');
    const items = planFor(group([a, b]), group([c]));
    expect(keys(items)).toEqual([`${c.id}:tint`, `${b.id}:tint`, `${a.id}:tint`]);
  });

  it('is plain JSON with unique, stable keys', () => {
    const groups = [
      group([page({ banner: { text: 'A', edge: 'top', size: 'compact' }, frame: { widthPx: 3 } })]),
      group([anElementMark(), aPageMark()]),
    ];
    const plan = compose(PAGE_URL, aState({ siteGroups: groups }));
    expect(JSON.parse(JSON.stringify(plan))).toEqual(plan);
    expect(compose(PAGE_URL, aState({ siteGroups: groups }))).toEqual(plan);
    expect(new Set(keys(plan.items)).size).toBe(plan.items.length);
  });
});
