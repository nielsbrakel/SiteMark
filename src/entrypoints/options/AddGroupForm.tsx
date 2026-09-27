import { type FormEvent, type ReactNode, useState } from 'react';
import { t } from '@/lib/i18n/browser-source';
import { Button } from '@/ui/components/Button';
import { Field } from '@/ui/components/Field';
import { commandErrorText } from './command-error';
import styles from './GroupList.module.css';
import { sendTracked } from './save-status';

export type AddGroupFormProps = {
  /** Called with the revision that added the group, so the page can open it. */
  readonly onAdded: (revision: number) => void;
};

/** Adds a site group at the bottom of the list (REQ-GRP-001); the core checks the name. */
export function AddGroupForm({ onAdded }: AddGroupFormProps): ReactNode {
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();
  const add = async (event: FormEvent) => {
    event.preventDefault();
    const result = await sendTracked({ type: 'createSiteGroup', name });
    if (!result.ok) return setError(commandErrorText(result.error));
    setError(undefined);
    setName('');
    onAdded(result.value.revision);
  };
  return (
    <form className={styles.add} onSubmit={(event) => void add(event)}>
      <Field label={t('optionsNewGroup')} {...(error && { error })}>
        {(control) => (
          <input {...control} value={name} onChange={(event) => setName(event.target.value)} />
        )}
      </Field>
      <Button type="submit">{t('optionsAddGroup')}</Button>
    </form>
  );
}
