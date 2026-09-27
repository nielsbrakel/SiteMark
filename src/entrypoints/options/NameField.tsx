import { type FormEvent, type ReactNode, useState } from 'react';
import type { SiteGroup } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { Field } from '@/ui/components/Field';
import { sendCommand } from '@/ui/hooks/use-command';
import { commandErrorText } from './command-error';

/**
 * The site group's name (REQ-GRP-001), saved when the field loses focus or on Enter. A refused
 * name stays in the field with the reason below it, and blocks nothing else (REQ-OPT-006).
 */
export function NameField({ group }: { readonly group: SiteGroup }): ReactNode {
  const [name, setName] = useState(group.name);
  const [error, setError] = useState<string>();
  const save = async () => {
    if (name === group.name) return setError(undefined);
    const result = await sendCommand({ type: 'renameSiteGroup', id: group.id, name });
    setError(result.ok ? undefined : commandErrorText(result.error));
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void save();
  };
  return (
    <form onSubmit={submit}>
      <Field label={t('optionsGroupName')} {...(error && { error })}>
        {(control) => (
          <input
            {...control}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => void save()}
          />
        )}
      </Field>
    </form>
  );
}
