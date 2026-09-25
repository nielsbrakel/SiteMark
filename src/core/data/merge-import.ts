import type { SiteGroupErrorCode } from '../errors';
import type { IdGen, SiteGroupId } from '../ids';
import type { OriginPattern, RegexPattern, SiteGroup, SiteMarkState } from '../model/schema';
import { err, ok, type Result } from '../result';
import { idsOfSiteGroup, withFreeIds } from './free-ids';
import type { ImportData } from './import';
import { originsToRequest } from './origins';

// Applying a parsed import (REQ-DATA-004): a preview, then Merge (D-218) or Replace. Like the
// reducers, these never touch the revision; the command queue bumps it.

/** A regex pattern or exclude in the file, highlighted in the preview. */
export type ImportedRegex = {
  readonly siteGroupId: SiteGroupId;
  readonly list: 'patterns' | 'excludes';
  readonly pattern: RegexPattern;
};

export type ImportPreview = {
  /** Site groups in the file whose ID exists locally. */
  readonly updated: number;
  /** Site groups in the file that are new. */
  readonly added: number;
  /** Origins the imported groups need that the local state did not (the same for both modes). */
  readonly newOrigins: OriginPattern[];
  readonly regexPatterns: ImportedRegex[];
};

export type MergeError = Extract<SiteGroupErrorCode, 'siteGroupLimitReached'>;

const MAX_SITE_GROUPS = 200;

function regexPatternsOf(group: SiteGroup): ImportedRegex[] {
  return (['patterns', 'excludes'] as const).flatMap((list) =>
    group[list].flatMap((pattern) =>
      pattern.kind === 'regex' ? [{ siteGroupId: group.id, list, pattern }] : [],
    ),
  );
}

/** What the file would change: "N updated, M new, K new origins", with its regex patterns. */
export function previewImport(local: SiteMarkState, incoming: ImportData): ImportPreview {
  const localIds = new Set(local.siteGroups.map((group) => group.id));
  const updated = incoming.siteGroups.filter((group) => localIds.has(group.id)).length;
  return {
    updated,
    added: incoming.siteGroups.length - updated,
    // Merge keeps only local groups, whose origins are known, so both modes need the same origins.
    newOrigins: originsToRequest(local, { ...local, siteGroups: incoming.siteGroups }),
    regexPatterns: incoming.siteGroups.flatMap(regexPatternsOf),
  };
}

/**
 * Merge: a file group with a local group's ID replaces it in place, other file groups are appended
 * at the bottom in file order, and the local settings stay (D-218). An imported item whose ID a
 * remaining local group already uses gets a fresh ID, so IDs stay unique. At most 200 site groups.
 */
export function mergeImport(
  local: SiteMarkState,
  incoming: ImportData,
  { idGen }: { readonly idGen: IdGen },
): Result<SiteMarkState, MergeError> {
  const incomingIds = new Set<string>(incoming.siteGroups.map((group) => group.id));
  const localIds = new Set<string>(local.siteGroups.map((group) => group.id));
  const staying = local.siteGroups.filter((group) => !incomingIds.has(group.id));
  const taken = new Set(staying.flatMap(idsOfSiteGroup));
  const updates = new Map<string, SiteGroup>();
  const added: SiteGroup[] = [];
  for (const group of incoming.siteGroups) {
    const merged = withFreeIds(group, taken, idGen);
    if (localIds.has(group.id)) updates.set(group.id, merged);
    else added.push(merged);
  }
  const siteGroups = [...local.siteGroups.map((group) => updates.get(group.id) ?? group), ...added];
  if (siteGroups.length > MAX_SITE_GROUPS) return err('siteGroupLimitReached');
  return ok({ ...local, siteGroups });
}

/** Replace (after confirmation): the file's site groups and settings replace the local ones. */
export function replaceImport(local: SiteMarkState, incoming: ImportData): SiteMarkState {
  return { ...local, siteGroups: incoming.siteGroups, settings: incoming.settings };
}
