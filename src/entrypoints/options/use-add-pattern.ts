import { type FormEvent, useState } from 'react';
import { errorMessageKey } from '@/core/errors';
import type { SiteGroupId } from '@/core/ids';
import { t } from '@/lib/i18n/browser-source';
import { requestOrigins } from '@/platform/permissions';
import { sendCommand } from '@/ui/hooks/use-command';
import { commandErrorText } from './command-error';
import { checkPatternInput, type PatternInput } from './pattern-draft';

type FieldErrors = { readonly pattern?: string; readonly origins?: string };

const EMPTY: PatternInput = { kind: 'wildcard', value: '', origins: '' };

export type AddPattern = {
  readonly input: PatternInput;
  readonly errors: FieldErrors;
  readonly change: (next: Partial<PatternInput>) => void;
  readonly submit: (event: FormEvent) => void;
};

/**
 * The Add pattern form's state (REQ-OPT-002, REQ-PRIV-002). Submitting checks the input, then
 * prompts for its origins first and synchronously (D-229) and sends addPattern without waiting
 * for the answer: a pattern is added granted or not, and its row shows the grant.
 */
export function useAddPattern(groupId: SiteGroupId): AddPattern {
  const [input, setInput] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const add = async (draft: Parameters<typeof checkPatternInput>[0]) => {
    const checked = checkPatternInput(draft);
    if (!checked.ok) return setErrors({ [checked.field]: t(errorMessageKey(checked.code)) });
    void requestOrigins(checked.origins);
    const result = await sendCommand({ type: 'addPattern', groupId, draft: checked.draft });
    if (!result.ok) return setErrors({ pattern: commandErrorText(result.error) });
    setErrors({});
    setInput((current) => ({ ...current, value: '', origins: '' }));
  };
  return {
    input,
    errors,
    change: (next) => setInput((current) => ({ ...current, ...next })),
    submit: (event) => {
      event.preventDefault();
      void add(input);
    },
  };
}
