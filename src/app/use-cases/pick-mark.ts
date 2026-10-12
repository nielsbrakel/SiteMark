import type { ElementEffects, ElementMark, MarkDraft } from '../../core/model/schema';
import { assertNever } from '../../core/result';
import type { ElementEffectKind, SavePick } from '../protocol';

// What a pick turns into (REQ-PICK-005): the panel only chooses effect chips and a color, so each
// chip gets default settings here; the options page tunes them later ("More options…").

const RIBBON_TEXT_MAX = 16;

function effectFor(kind: ElementEffectKind, hostname: string): ElementEffects {
  switch (kind) {
    case 'ribbon':
      return { ribbon: { text: hostname.slice(0, RIBBON_TEXT_MAX), corner: 'top-right' } };
    case 'outline':
      return { outline: { widthPx: 3, style: 'solid', pulse: false } };
    case 'tint':
      return { tint: { opacityPct: 20 } };
    case 'stripes':
      return { stripes: { opacityPct: 20 } };
    default:
      return assertNever(kind);
  }
}

/** The element mark a pick describes; a ribbon shows the host, like "Mark this site". */
export function pickedMark(pick: SavePick, hostname: string): MarkDraft {
  return {
    enabled: true,
    color: pick.color,
    textColor: 'auto',
    target: { kind: 'element', selector: pick.selector },
    effects: pick.effects.reduce<ElementEffects>(
      (effects, kind) => ({ ...effects, ...effectFor(kind, hostname) }),
      {},
    ),
  };
}

/** The same mark on a new element: a re-pick keeps everything else (REQ-PICK-007). */
export function repickedMark({ id: _, ...mark }: ElementMark, selector: string): MarkDraft {
  return { ...mark, target: { kind: 'element', selector } };
}
