import type { core } from 'zod';
import type { SiteMarkState } from './schema';

type IdAt = { path: (string | number)[]; id: string };

const LISTS = ['patterns', 'excludes', 'marks'] as const;

/** Every ID in the state with its path, in document order. */
function* idsOf(state: SiteMarkState): Generator<IdAt> {
  for (const [g, group] of state.siteGroups.entries()) {
    yield { path: ['siteGroups', g, 'id'], id: group.id };
    for (const list of LISTS) {
      for (const [i, item] of group[list].entries()) {
        yield { path: ['siteGroups', g, list, i, 'id'], id: item.id };
      }
    }
  }
}

/** IDs key commands and render plans, so each may appear once in the whole state. */
export function reportDuplicateIds(
  state: SiteMarkState,
  ctx: core.$RefinementCtx<SiteMarkState>,
): void {
  const seen = new Set<string>();
  for (const { path, id } of idsOf(state)) {
    if (seen.has(id)) ctx.addIssue({ code: 'custom', path, message: `Duplicate ID "${id}"` });
    seen.add(id);
  }
}
