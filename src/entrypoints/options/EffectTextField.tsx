import { type FormEvent, type ReactNode, useState } from 'react';
import { t } from '@/lib/i18n/browser-source';
import { Field } from '@/ui/components/Field';
import { useDebounced } from './use-debounced';

export type EffectTextFieldProps = {
  readonly label: string;
  readonly value: string;
  readonly maxLength: number;
  readonly onSave: (text: string) => void;
};

/**
 * A required effect text (REQ-MARK-015: ribbon, banner, watermark, title prefix), saved on blur or
 * Enter. An empty text is refused next to the field, so a mark never relies on color alone.
 */
export function EffectTextField({
  label,
  value,
  maxLength,
  onSave,
}: EffectTextFieldProps): ReactNode {
  const [text, setText] = useState(value);
  const [error, setError] = useState<string>();
  const save = () => {
    const trimmed = text.trim();
    if (!trimmed) return setError(t('optionsTextRequired'));
    setError(undefined);
    if (trimmed !== value) onSave(trimmed);
  };
  const autosave = useDebounced(save);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    autosave.flush();
  };
  return (
    <form onSubmit={submit}>
      <Field label={label} {...(error && { error })}>
        {(control) => (
          <input
            {...control}
            value={text}
            maxLength={maxLength}
            onChange={(event) => {
              setText(event.target.value);
              autosave.schedule();
            }}
            onBlur={autosave.flush}
          />
        )}
      </Field>
    </form>
  );
}
