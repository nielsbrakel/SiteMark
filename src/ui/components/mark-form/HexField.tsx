import { type FormEvent, type ReactNode, useState } from 'react';
import type { Hex } from '@/core/model/schema';
import { Field } from '../Field';
import { useT } from './translate';
import { useDebounced } from './use-debounced';

const HEX = /^#?([0-9a-f]{6})$/i;

/** `#rrggbb` (with or without `#`, any case) → lowercase `#rrggbb` (REQ-MARK-012). */
function parseHex(text: string): Hex | undefined {
  const digits = HEX.exec(text.trim())?.[1];
  return digits ? (`#${digits.toLowerCase()}` as Hex) : undefined;
}

export type HexFieldProps = {
  readonly label: string;
  readonly value: Hex;
  /** Saves a valid, changed color; returns the refusal text, if any. */
  readonly onSave: (color: Hex) => Promise<string | undefined>;
};

/** A hex color field, saved on blur or Enter; a wrong value stays with the reason below it. */
export function HexField({ label, value, onSave }: HexFieldProps): ReactNode {
  const t = useT();
  const [text, setText] = useState<string>(value);
  const [error, setError] = useState<string>();
  const [shown, setShown] = useState(value);
  // A color set elsewhere (a preset, the picker) replaces the text, unless the text already is it.
  if (value !== shown) {
    setShown(value);
    if (parseHex(text) !== value) setText(value);
  }
  const save = async () => {
    const color = parseHex(text);
    if (!color) return setError(t('optionsHexInvalid'));
    setError(color === value ? undefined : await onSave(color));
  };
  const autosave = useDebounced(() => void save());
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
            spellCheck={false}
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
