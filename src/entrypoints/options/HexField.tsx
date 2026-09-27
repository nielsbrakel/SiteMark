import { type FormEvent, type ReactNode, useState } from 'react';
import type { Hex } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { Field } from '@/ui/components/Field';

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
  const [text, setText] = useState<string>(value);
  const [error, setError] = useState<string>();
  const save = async () => {
    const color = parseHex(text);
    if (!color) return setError(t('optionsHexInvalid'));
    setError(color === value ? undefined : await onSave(color));
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void save();
  };
  return (
    <form onSubmit={submit}>
      <Field label={label} {...(error && { error })}>
        {(control) => (
          <input
            {...control}
            value={text}
            spellCheck={false}
            onChange={(event) => setText(event.target.value)}
            onBlur={() => void save()}
          />
        )}
      </Field>
    </form>
  );
}
