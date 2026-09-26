import { describe, expect, it } from 'vitest';
import type { Hex } from '../model/schema';
import {
  anElementMark,
  aPageMark,
  aSiteGroup,
  aState,
  aWildcardPattern,
} from '../testing/builders';
import { compose } from './compose';
import { diffPlan } from './diff-plan';
import { emptyPlan, type RenderItem, type RenderPlan } from './render-plan';

const PAGE_URL = 'https://app.example.com/';
const matching = [aWildcardPattern({ value: '*.example.com' })];
const ribbon = aPageMark({ effects: { ribbon: { text: 'PROD', corner: 'top-right' } } });
const frame = aPageMark({ effects: { frame: { widthPx: 4 } } });
const outline = anElementMark();

const planOf = (...marks: Parameters<typeof aSiteGroup>[0][]): RenderPlan =>
  compose(
    PAGE_URL,
    aState({
      siteGroups: marks.map((overrides) => aSiteGroup({ patterns: matching, ...overrides })),
    }),
  );
const keys = (items: readonly RenderItem[]) => items.map((item) => item.key);

describe('REQ-RND-007 diffPlan: only what changed is re-mounted (keyed diff)', () => {
  const plan = planOf({ marks: [ribbon, frame, outline] });

  it('finds nothing to do between equal plans, even rebuilt ones', () => {
    const none = { add: [], update: [], remove: [] };
    expect(diffPlan(plan, plan)).toEqual(none);
    expect(diffPlan(plan, JSON.parse(JSON.stringify(plan)))).toEqual(none);
    expect(diffPlan(emptyPlan(), emptyPlan())).toEqual(none);
  });

  it('adds everything to an empty plan and removes everything for an empty plan', () => {
    expect(diffPlan(emptyPlan(), plan)).toEqual({ add: plan.items, update: [], remove: [] });
    expect(diffPlan(plan, emptyPlan())).toEqual({ add: [], update: [], remove: plan.items });
  });

  it('updates an item when any field changes, with its next version', () => {
    const wider = { ...frame, effects: { frame: { widthPx: 8 } } };
    const blue = { ...ribbon, color: '#1f6feb' as Hex };
    const moved = { ...outline, target: { kind: 'element' as const, selector: '#main' } };
    const next = planOf({ marks: [blue, wider, moved] });
    const diff = diffPlan(plan, next);
    expect(diff.add).toEqual([]);
    expect(diff.remove).toEqual([]);
    expect(keys(diff.update).sort()).toEqual(keys(plan.items).sort());
    expect(diff.update).toEqual(next.items);
  });

  it('keeps unchanged items out of the diff', () => {
    const renamed = {
      ...ribbon,
      effects: { ribbon: { text: 'LIVE', corner: 'top-right' as const } },
    };
    const diff = diffPlan(plan, planOf({ marks: [renamed, frame, outline] }));
    expect(keys(diff.update)).toEqual([`${ribbon.id}:ribbon`]);
    expect(diff.update[0]?.params).toEqual({ text: 'LIVE', corner: 'top-right' });
  });

  it('removes and adds when the key changes, e.g. another mark wins a ribbon corner', () => {
    const rival = aPageMark({ effects: { ribbon: { text: 'EU', corner: 'top-right' } } });
    const before = planOf({ marks: [ribbon] }, { marks: [rival] });
    const after = planOf({ marks: [rival] }, { marks: [ribbon] });
    const diff = diffPlan(before, after);
    expect(keys(diff.remove)).toEqual([`${ribbon.id}:ribbon`]);
    expect(keys(diff.add)).toEqual([`${rival.id}:ribbon`]);
    expect(diff.remove[0]).toEqual(before.items[0]);
  });

  it('updates a merged banner when a banner joins it', () => {
    const top = aPageMark({ effects: { banner: { text: 'PROD', edge: 'top', size: 'compact' } } });
    const also = aPageMark({ effects: { banner: { text: 'EU', edge: 'top', size: 'regular' } } });
    const diff = diffPlan(planOf({ marks: [top] }), planOf({ marks: [top, also] }));
    expect(diff.add).toEqual([]);
    expect(diff.update).toEqual([
      expect.objectContaining({ key: 'banner:top', markIds: [top.id, also.id] }),
    ]);
  });

  it('lists additions and updates in the next plan order', () => {
    const tint = aPageMark({ effects: { tint: { opacityPct: 5 } } });
    const stripes = aPageMark({ effects: { stripes: { opacityPct: 9, area: 'edge' } } });
    const diff = diffPlan(emptyPlan(), planOf({ marks: [stripes, tint, ribbon, frame] }));
    expect(diff.add.map((item) => item.z)).toEqual([0, 1, 2, 3]);
  });
});
