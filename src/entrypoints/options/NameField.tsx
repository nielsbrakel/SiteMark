import { type FormEvent, type ReactNode, useState } from 'react';
import type { SiteGroup } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { Field } from '@/ui/components/Field';
import { useDebounced } from '@/ui/components/mark-form/use-debounced';
import { commandErrorText } from './command-error';
import { sendTracked } from './save-status';

/**
 * The site group's name (REQ-GRP-001), saved when the field loses focus or on Enter. A refused
 * name stays in the field with the reason below it, and blocks nothing else (REQ-OPT-006).
 */
export function NameField({ group }: { readonly group: SiteGroup }): ReactNode {
  const [name, setName] = useState(group.name);
  const [error, setError] = useState<string>();
  const save = async () => {
    if (name === group.name) return setError(undefined);
    const result = await sendTracked({ type: 'renameSiteGroup', id: group.id, name });
    setError(result.ok ? undefined : commandErrorText(result.error));
  };
  const autosave = useDebounced(() => void save());
  const submit = (event: FormEvent) => {
    event.preventDefault();
    autosave.flush();
  };
  return (
    <form onSubmit={submit}>
      <Field label={t('optionsGroupName')} {...(error && { error })}>
        {(control) => (
          <input
            {...control}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              autosave.schedule();
            }}
            onBlur={autosave.flush}
          />
        )}
      </Field>
    </form>
  );
}
