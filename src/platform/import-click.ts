import type { Committed } from '../app/command-queue';
import type {
  ImportFailure,
  ImportFile,
  ImportMode,
  ImportSummary,
  MessagingError,
} from '../app/protocol';
import type { Result } from '../core/result';
import { type RequestOutcome, requestOrigins } from './permissions';
import { sendToBackground } from './send-message';

export type ImportApplyClick = {
  /** On `denied` or `failed` the groups still arrive, in the "Not granted — Allow" state. */
  readonly permission: Promise<RequestOutcome>;
  readonly reply: Promise<Result<Result<Committed, ImportFailure>, MessagingError>>;
};

/**
 * The options page's import "Apply" click handler (REQ-DATA-005, D-229). Call it synchronously in
 * the click, with the preview the page got before: it requests every new origin in ONE prompt,
 * then sends importApply without waiting for the answer.
 */
export function importApplyClick(
  file: ImportFile & { readonly mode: ImportMode },
  preview: Pick<ImportSummary, 'originsToRequest'>,
): ImportApplyClick {
  const permission = requestOrigins(preview.originsToRequest);
  const reply = sendToBackground('importApply', { text: file.text, mode: file.mode });
  return { permission, reply };
}
