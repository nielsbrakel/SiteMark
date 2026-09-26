import { NAME_MAX } from '../../core/commands/groups';
import type { IdGen } from '../../core/ids';
import type { SiteOrigin } from '../../core/model/defaults';
import type { ElementEffects, ElementMark, MarkDraft, SiteGroup } from '../../core/model/schema';
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

/**
 * "New site group for <origin>" (REQ-PICK-005): enabled, named after the host and matching exactly
 * this host and port, like "Mark this site" (D-201), but without the ribbon: the pick is its mark.
 */
export function pickSiteGroup({ hostname, port }: SiteOrigin, idGen: IdGen): SiteGroup {
  const hostAndPort = port ? `${hostname}:${port}` : hostname;
  return {
    id: idGen.siteGroupId(),
    name: hostname.slice(0, NAME_MAX),
    enabled: true,
    patterns: [{ id: idGen.patternId(), kind: 'wildcard', value: `*://${hostAndPort}/*` }],
    excludes: [],
    marks: [],
  };
}
