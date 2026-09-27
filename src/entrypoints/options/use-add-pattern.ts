import { type FormEvent, useState } from 'react';
import type { Command } from '@/core/commands/command';
import { errorMessageKey } from '@/core/errors';
import type { SiteGroupId } from '@/core/ids';
import type { UrlPatternDraft } from '@/core/url/match';
import { t } from '@/lib/i18n/browser-source';
import { requestOrigins } from '@/platform/permissions';
import { sendCommand } from '@/ui/hooks/use-command';
import { commandErrorText } from './command-error';
import { checkPatternInput, type PatternInput } from './pattern-draft';
import type { PatternListKind } from './pattern-lists';

type FieldErrors = { readonly pattern?: string; readonly origins?: string };

const EMPTY: PatternInput = { kind: 'wildcard', value: '', origins: '' };

export type AddPattern = {
  readonly list: PatternListKind;
  readonly input: PatternInput;
  readonly errors: FieldErrors;
  readonly change: (next: Partial<PatternInput>) => void;
  readonly submit: (event: FormEvent) => void;
};

function addCommand(list: PatternListKind, groupId: SiteGroupId, draft: UrlPatternDraft): Command {
  return list === 'patterns'
    ? { type: 'addPattern', groupId, draft }
    : { type: 'addExclude', groupId, draft };
}

/**
 * The state of an Add form (REQ-OPT-002, REQ-PRIV-002, REQ-URL-008). Submitting checks the input;
 * a URL pattern then prompts for its origins first and synchronously (D-229) and is sent without
 * waiting for the answer: it is added granted or not, and its row shows the grant. Excludes only
 * narrow a match, so they need no origins.
 */
export function useAddPattern(groupId: SiteGroupId, list: PatternListKind): AddPattern {
  const [input, setInput] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const add = async (draft: Parameters<typeof checkPatternInput>[0]) => {
    const checked = checkPatternInput(draft);
    if (!checked.ok) return setErrors({ [checked.field]: t(errorMessageKey(checked.code)) });
    if (list === 'patterns') void requestOrigins(checked.origins);
    const result = await sendCommand(addCommand(list, groupId, checked.draft));
    if (!result.ok) return setErrors({ pattern: commandErrorText(result.error) });
    setErrors({});
    setInput((current) => ({ ...current, value: '', origins: '' }));
  };
  return {
    list,
    input,
    errors,
    change: (next) => setInput((current) => ({ ...current, ...next })),
    submit: (event) => {
      event.preventDefault();
      void add(input);
    },
  };
}
