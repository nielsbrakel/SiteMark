import { type FormEvent, type ReactNode, useRef, useState } from 'react';
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

/**
 * Adds a site group at the bottom of the list (REQ-GRP-001); the core checks the name. A refused
 * name moves focus to the field, which reads the reason (WCAG 4.1.3).
 */
export function AddGroupForm({ onAdded }: AddGroupFormProps): ReactNode {
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();
  const input = useRef<HTMLInputElement>(null);
  const add = async (event: FormEvent) => {
    event.preventDefault();
    const result = await sendTracked({ type: 'createSiteGroup', name });
    if (!result.ok) {
      setError(commandErrorText(result.error));
      return input.current?.focus();
    }
    setError(undefined);
    setName('');
    onAdded(result.value.revision);
  };
  return (
    <form className={styles.add} onSubmit={(event) => void add(event)}>
      <Field label={t('optionsNewGroup')} {...(error && { error })}>
        {(control) => (
          <input
            {...control}
            ref={input}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        )}
      </Field>
      <Button type="submit">{t('optionsAddGroup')}</Button>
    </form>
  );
}
