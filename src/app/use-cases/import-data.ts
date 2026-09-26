import { type ImportData, parseImport } from '../../core/data/import';
import { mergeImport, previewImport, replaceImport } from '../../core/data/merge-import';
import type { IdGen } from '../../core/ids';
import type { SiteMarkState } from '../../core/model/schema';
import { err, ok, type Result } from '../../core/result';
import type { OriginPattern } from '../../core/url/origin';
import type { CommandQueue, Committed } from '../command-queue';
import type { Permissions, StateRepo } from '../ports';
import type { ImportFailure, ImportFile, ImportMode, ImportSummary } from '../protocol';
import { completeGrant, type GrantDeps } from './grant';

// Import (REQ-DATA-004, REQ-DATA-005, D-229). The options page reads the file and asks for a
// preview, which lists the new origins that are not granted yet. Its Apply click handler requests
// exactly those in ONE prompt, first and synchronously, then sends importApply without awaiting
// (src/platform/import-click.ts). The background keeps no preview in memory (the service worker
// may stop in between): apply parses the text again and runs merge or replace in the queue.

export type ImportDataDeps = {
  readonly stateRepo: Pick<StateRepo, 'load'>;
  readonly permissions: Pick<Permissions, 'contains'>;
  readonly queue: Pick<CommandQueue, 'run'>;
  readonly idGen: IdGen;
  readonly grant: GrantDeps;
};

async function notGranted(
  permissions: ImportDataDeps['permissions'],
  origins: readonly OriginPattern[],
): Promise<OriginPattern[]> {
  const granted = await Promise.all(origins.map((origin) => permissions.contains([origin])));
  return origins.filter((_, index) => !granted[index]);
}

/** "N updated, M new, K new origins", the regex patterns, and the origins Apply must request. */
export async function previewImportFile(
  deps: ImportDataDeps,
  { text }: ImportFile,
): Promise<Result<ImportSummary, ImportFailure>> {
  const data = parseImport(text);
  if (!data.ok) return data;
  const { state } = await deps.stateRepo.load();
  const { newOrigins, ...counts } = previewImport(state, data.value);
  return ok({ ...counts, originsToRequest: await notGranted(deps.permissions, newOrigins) });
}

function applied(state: SiteMarkState, data: ImportData, mode: ImportMode, idGen: IdGen) {
  return mode === 'merge' ? mergeImport(state, data, { idGen }) : ok(replaceImport(state, data));
}

/**
 * Applies the file through the queue, then completes the grant for its new origins: when the user
 * answered the prompt before the import landed, onAdded found no group to register them for.
 */
export async function applyImportFile(
  deps: ImportDataDeps,
  { text, mode }: ImportFile & { readonly mode: ImportMode },
): Promise<Result<Committed, ImportFailure>> {
  const data = parseImport(text);
  if (!data.ok) return data;
  let newOrigins: readonly OriginPattern[] = [];
  const committed = await deps.queue.run((state) => {
    newOrigins = previewImport(state, data.value).newOrigins;
    return applied(state, data.value, mode, deps.idGen);
  });
  if (!committed.ok) return err({ code: committed.error });
  if (newOrigins.length > 0) await completeGrant(deps.grant, newOrigins);
  return committed;
}
