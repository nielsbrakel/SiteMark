import type { ReactNode } from 'react';
import { t } from '@/lib/i18n/browser-source';
import { Button } from '@/ui/components/Button';
import { Field } from '@/ui/components/Field';
import { Segmented } from '@/ui/components/Segmented';
import styles from './PatternEditor.module.css';
import type { PatternKind } from './pattern-draft';
import { LIST_TEXT } from './pattern-lists';
import type { AddPattern } from './use-add-pattern';

const kinds = (): readonly { value: PatternKind; label: string }[] => [
  { value: 'wildcard', label: t('optionsPatternWildcard') },
  { value: 'regex', label: t('optionsPatternRegex') },
];

/** Adds a wildcard or regex pattern or exclude with an explicit Add (REQ-OPT-002, REQ-OPT-006). */
export function AddPatternForm({ form }: { readonly form: AddPattern }): ReactNode {
  const { input, errors, change, submit } = form;
  const text = LIST_TEXT[form.list];
  const isRegex = input.kind === 'regex';
  return (
    <form className={styles.form} onSubmit={submit}>
      <Segmented
        label={t(text.type)}
        options={kinds()}
        value={input.kind}
        onChange={(kind) => change({ kind })}
      />
      <Field
        label={t(text.input)}
        description={t(isRegex ? 'optionsRegexHelp' : 'optionsPatternHelp')}
        {...(errors.pattern && { error: errors.pattern })}
      >
        {(control) => (
          <input
            {...control}
            value={input.value}
            spellCheck={false}
            onChange={(event) => change({ value: event.target.value })}
          />
        )}
      </Field>
      {isRegex && (
        <Field
          label={t(text.origins)}
          description={t('optionsOriginsHelp')}
          {...(errors.origins && { error: errors.origins })}
        >
          {(control) => (
            <input
              {...control}
              value={input.origins}
              spellCheck={false}
              onChange={(event) => change({ origins: event.target.value })}
            />
          )}
        </Field>
      )}
      <Button type="submit">{t(text.add)}</Button>
    </form>
  );
}
