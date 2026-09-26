import type { IdGen } from '../../core/ids';
import { notImplemented } from '../../core/not-implemented';
import type { Result } from '../../core/result';
import type { CommandQueue, Committed } from '../command-queue';
import type { Permissions, StateRepo } from '../ports';
import type { ImportFailure, ImportFile, ImportMode, ImportSummary } from '../protocol';
import type { GrantDeps } from './grant';

export type ImportDataDeps = {
  readonly stateRepo: Pick<StateRepo, 'load'>;
  readonly permissions: Pick<Permissions, 'contains'>;
  readonly queue: Pick<CommandQueue, 'run'>;
  readonly idGen: IdGen;
  readonly grant: GrantDeps;
};

/** The import preview (REQ-DATA-004, REQ-DATA-005). */
export async function previewImportFile(
  _deps: ImportDataDeps,
  _file: ImportFile,
): Promise<Result<ImportSummary, ImportFailure>> {
  return notImplemented();
}

/** Applies an import file (REQ-DATA-004, REQ-DATA-005). */
export async function applyImportFile(
  _deps: ImportDataDeps,
  _request: ImportFile & { readonly mode: ImportMode },
): Promise<Result<Committed, ImportFailure>> {
  return notImplemented();
}
