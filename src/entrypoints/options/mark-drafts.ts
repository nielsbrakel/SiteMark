import { presetColor } from '@/core/model/presets';
import type { ElementEffects, Mark, MarkDraft, PageEffects, Ribbon } from '@/core/model/schema';

// Mark drafts the options page builds (REQ-OPT-003): new page marks, and a mark moved to the other
// target with only the effects that target has (REQ-MARK-001; ranges differ per target).

const RIBBON_TEXT_MAX = 16;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** The site group's name cut to `max` characters (whole code points), for a default text. */
export function nameText(groupName: string, max: number): string {
  return Array.from(groupName).slice(0, max).join('').trim();
}

/** A top-right ribbon showing the site group's name. */
export function nameRibbon(groupName: string): Ribbon {
  return { text: nameText(groupName, RIBBON_TEXT_MAX), corner: 'top-right' };
}

/** "Add page mark": a red ribbon with the site group's name. */
export function newPageMark(groupName: string): MarkDraft {
  return {
    enabled: true,
    color: presetColor('red'),
    textColor: 'auto',
    target: { kind: 'page' },
    effects: { ribbon: nameRibbon(groupName) },
  };
}

/** The mark without its ID, as updateMark takes it. */
export function draftOf(mark: Mark): MarkDraft {
  const { id: _id, ...draft } = mark;
  return draft;
}

function pageEffectsFrom(effects: ElementEffects, groupName: string): PageEffects {
  const page: PageEffects = {
    ...(effects.ribbon && { ribbon: effects.ribbon }),
    ...(effects.tint && { tint: { opacityPct: clamp(effects.tint.opacityPct, 3, 15) } }),
    ...(effects.stripes && { stripes: { opacityPct: effects.stripes.opacityPct, area: 'edge' } }),
  };
  return Object.keys(page).length > 0 ? page : { ribbon: nameRibbon(groupName) };
}

function elementEffectsFrom(effects: PageEffects): ElementEffects {
  const element: ElementEffects = {
    ...(effects.ribbon && { ribbon: effects.ribbon }),
    ...(effects.tint && { tint: { opacityPct: clamp(effects.tint.opacityPct, 5, 40) } }),
    ...(effects.stripes && { stripes: { opacityPct: effects.stripes.opacityPct } }),
  };
  return Object.keys(element).length > 0
    ? element
    : { outline: { widthPx: 2, style: 'solid', pulse: false } };
}

type PageDraft = Extract<MarkDraft, { target: { kind: 'page' } }>;

/** TypeScript doesn't narrow on the nested `target.kind`, so this guard does. */
function isPageDraft(draft: MarkDraft): draft is PageDraft {
  return draft.target.kind === 'page';
}

/** The mark as a page mark; effects a page doesn't have are dropped (a ribbon if none is left). */
export function asPageMark(mark: Mark, groupName: string): MarkDraft {
  const draft = draftOf(mark);
  if (isPageDraft(draft)) return draft;
  return { ...draft, target: { kind: 'page' }, effects: pageEffectsFrom(draft.effects, groupName) };
}

/** The mark as an element mark on `selector`; page-only effects are dropped (an outline if none). */
export function asElementMark(mark: Mark, selector: string): MarkDraft {
  const draft = draftOf(mark);
  const target = { kind: 'element', selector } as const;
  if (!isPageDraft(draft)) return { ...draft, target };
  return { ...draft, target, effects: elementEffectsFrom(draft.effects) };
}
