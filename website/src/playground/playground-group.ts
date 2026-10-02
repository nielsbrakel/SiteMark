import type { MarkId, PatternId, SiteGroupId } from '@/core/ids';
import type { ElementEffects, Mark, PageEffects, SiteGroup } from '@/core/model/schema';
import type { PlaygroundState } from './playground-state';

// The playground's site group (REQ-PLAY-002): what the controls say, as the extension stores it.
// It is never stored anywhere, only composed into a render plan.

function pageEffects({ text, corner, edge, pageEffects: on }: PlaygroundState): PageEffects {
  const all: Required<Omit<PageEffects, 'favicon'>> = {
    ribbon: { text, corner },
    banner: { text, edge, size: 'regular' },
    frame: { widthPx: 6 },
    tint: { opacityPct: 8 },
    stripes: { opacityPct: 20, area: 'edge' },
    watermark: { text, opacityPct: 8 },
    titlePrefix: { text },
  };
  return Object.fromEntries(on.map((name) => [name, all[name]]));
}

function elementEffects({ corner, elementEffects: on }: PlaygroundState): ElementEffects {
  const all: Required<ElementEffects> = {
    outline: { widthPx: 3, style: 'solid', pulse: false },
    tint: { opacityPct: 20 },
    stripes: { opacityPct: 25 },
    ribbon: { text: 'DELETE', corner },
  };
  return Object.fromEntries(on.map((name) => [name, all[name]]));
}

/** The address the mock browser shows, which the playground's site group matches. */
export const PLAYGROUND_ADDRESS = 'https://shop.example.com/';
/** The selector of the sample page's button (the preview has one element target). */
const BUTTON_SELECTOR = '#delete-customer';

/** The playground's own site group (REQ-PLAY-002): never stored, only composed. */
export function playgroundGroup(state: PlaygroundState): SiteGroup {
  const base = { enabled: true, color: state.color, textColor: 'auto' } as const;
  const marks: Mark[] = [];
  if (state.pageEffects.length) {
    const effects = pageEffects(state);
    marks.push({ ...base, id: 'playPage0001' as MarkId, target: { kind: 'page' }, effects });
  }
  if (state.elementEffects.length) {
    const target = { kind: 'element', selector: BUTTON_SELECTOR } as const;
    marks.push({ ...base, id: 'playElem0001' as MarkId, target, effects: elementEffects(state) });
  }
  return {
    id: 'playground01' as SiteGroupId,
    name: 'Playground',
    enabled: true,
    patterns: [
      { id: 'playPatt0001' as PatternId, kind: 'wildcard', value: '*://shop.example.com/*' },
    ],
    excludes: [],
    marks,
  };
}
