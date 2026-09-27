import { type FormEvent, type ReactNode, useState } from 'react';
import { t } from '@/lib/i18n/browser-source';
import { Field } from '@/ui/components/Field';
import { isValidSelector } from './selector';
import { useDebounced } from './use-debounced';

export type SelectorFieldProps = {
  /** The stored selector; empty for a page mark that is becoming an element mark. */
  readonly selector: string;
  /** Saves a valid, changed selector; returns the refusal text, if any. */
  readonly onSave: (selector: string) => Promise<string | undefined>;
};

/**
 * The element's CSS selector (REQ-OPT-003), saved on blur or Enter once its syntax checks out. An
 * invalid selector stays in the field with the reason below it (REQ-OPT-006).
 */
export function SelectorField({ selector, onSave }: SelectorFieldProps): ReactNode {
  const [value, setValue] = useState(selector);
  const [error, setError] = useState<string>();
  const save = async () => {
    if (!isValidSelector(value)) return setError(t('optionsSelectorInvalid'));
    setError(value === selector ? undefined : await onSave(value));
  };
  const autosave = useDebounced(() => void save());
  const submit = (event: FormEvent) => {
    event.preventDefault();
    autosave.flush();
  };
  return (
    <form onSubmit={submit}>
      <Field
        label={t('optionsSelector')}
        description={t('optionsSelectorHelp')}
        {...(error && { error })}
      >
        {(control) => (
          <input
            {...control}
            value={value}
            spellCheck={false}
            onChange={(event) => {
              setValue(event.target.value);
              autosave.schedule();
            }}
            onBlur={autosave.flush}
          />
        )}
      </Field>
    </form>
  );
}
