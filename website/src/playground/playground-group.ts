import type { MarkId, PatternId, SiteGroupId } from '@/core/ids';
import type { Mark, SiteGroup } from '@/core/model/schema';
import type { PlaygroundState } from './playground-state';

// The playground's site group (REQ-PLAY-002): what the form says, as the extension stores it. It is
// never stored anywhere, only composed into a render plan.

/** The address the mock browser shows, which the playground's site group matches. */
export const PLAYGROUND_ADDRESS = 'https://shop.example.com/';
/** The selector of the sample page's button (the preview has one element target). */
const BUTTON_SELECTOR = '#delete-customer';

/** The playground's own site group (REQ-PLAY-002): never stored, only composed. */
export function playgroundGroup({
  color,
  textColor,
  pageEffects,
  elementEffects,
}: PlaygroundState): SiteGroup {
  const base = { enabled: true, color, textColor } as const;
  const marks: Mark[] = [
    { ...base, id: 'playPage0001' as MarkId, target: { kind: 'page' }, effects: pageEffects },
  ];
  if (elementEffects) {
    const target = { kind: 'element', selector: BUTTON_SELECTOR } as const;
    marks.push({ ...base, id: 'playElem0001' as MarkId, target, effects: elementEffects });
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
