import type { Committed } from '../app/command-queue';
import type {
  ImportFailure,
  ImportFile,
  ImportMode,
  ImportSummary,
  MessagingError,
} from '../app/protocol';
import { notImplemented } from '../core/not-implemented';
import type { Result } from '../core/result';
import type { RequestOutcome } from './permissions';

export type ImportApplyClick = {
  readonly permission: Promise<RequestOutcome>;
  readonly reply: Promise<Result<Result<Committed, ImportFailure>, MessagingError>>;
};

/** The options page's import "Apply" click handler (REQ-DATA-005, D-229). */
export function importApplyClick(
  _file: ImportFile & { readonly mode: ImportMode },
  _preview: Pick<ImportSummary, 'originsToRequest'>,
): ImportApplyClick {
  return notImplemented();
}
