import { useState } from 'react';
import type { ImportFailure, ImportMode, ImportSummary } from '@/app/protocol';
import { errorMessageKey } from '@/core/errors';
import type { Result } from '@/core/result';
import { t } from '@/lib/i18n/browser-source';
import { importApplyClick } from '@/platform/import-click';
import { sendToBackground } from '@/platform/send-message';

/** A file the background previewed; Apply sends its text again (the background keeps nothing). */
export type PreviewedFile = { readonly text: string; readonly summary: ImportSummary };

export type ImportState =
  | { readonly status: 'idle' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'previewed'; readonly file: PreviewedFile }
  | { readonly status: 'imported' };

type Reply<T> = Result<Result<T, ImportFailure>, unknown>;

/** The readable reason of a refused file or import (REQ-DATA-004), or "couldn't save". */
function failureText(reply: Reply<unknown>): string | undefined {
  if (!reply.ok) return t('optionsSendFailed');
  return reply.value.ok ? undefined : t(errorMessageKey(reply.value.error.code));
}

export type Import = {
  readonly state: ImportState;
  /** Reads the chosen file and asks the background for a preview; changes nothing. */
  readonly choose: (file: File) => Promise<void>;
  /** Call synchronously in the click: one prompt for the new origins, then importApply. */
  readonly apply: (file: PreviewedFile, mode: ImportMode) => void;
};

/** The import flow of the Data page (REQ-DATA-004, REQ-DATA-005, D-229). */
export function useImport(): Import {
  const [state, setState] = useState<ImportState>({ status: 'idle' });
  const choose = async (chosen: File) => {
    const text = await chosen.text();
    const reply = await sendToBackground('importPreview', { text });
    const failure = failureText(reply);
    if (failure || !reply.ok || !reply.value.ok) {
      return setState({ status: 'error', message: failure ?? '' });
    }
    setState({ status: 'previewed', file: { text, summary: reply.value.value } });
  };
  const apply = (file: PreviewedFile, mode: ImportMode) => {
    const { reply } = importApplyClick({ text: file.text, mode }, file.summary);
    void reply.then((answer) => {
      const failure = failureText(answer);
      setState(failure ? { status: 'error', message: failure } : { status: 'imported' });
    });
  };
  return { state, choose, apply };
}
