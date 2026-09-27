import type { ReactNode } from 'react';
import type { SiteGroupId } from '@/core/ids';
import { t } from '@/lib/i18n/browser-source';
import { Button } from '@/ui/components/Button';
import { Field } from '@/ui/components/Field';
import { Segmented } from '@/ui/components/Segmented';
import styles from './PatternEditor.module.css';
import type { PatternKind } from './pattern-draft';
import { useAddPattern } from './use-add-pattern';

const kinds = (): readonly { value: PatternKind; label: string }[] => [
  { value: 'wildcard', label: t('optionsPatternWildcard') },
  { value: 'regex', label: t('optionsPatternRegex') },
];

/** Adds a wildcard or regex pattern with an explicit Add (REQ-OPT-002, REQ-OPT-006). */
export function AddPatternForm({ groupId }: { readonly groupId: SiteGroupId }): ReactNode {
  const { input, errors, change, submit } = useAddPattern(groupId);
  const isRegex = input.kind === 'regex';
  return (
    <form className={styles.form} onSubmit={submit}>
      <Segmented
        label={t('optionsPatternType')}
        options={kinds()}
        value={input.kind}
        onChange={(kind) => change({ kind })}
      />
      <Field
        label={t('optionsPatternInput')}
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
          label={t('optionsOrigins')}
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
      <Button type="submit">{t('optionsAddPattern')}</Button>
    </form>
  );
}
