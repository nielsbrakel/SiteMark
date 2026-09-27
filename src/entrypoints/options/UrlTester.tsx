import { type ReactNode, useId, useState } from 'react';
import type { UrlPattern } from '@/core/model/schema';
import { assertNever } from '@/core/result';
import { t } from '@/lib/i18n/browser-source';
import { Field } from '@/ui/components/Field';
import styles from './PatternEditor.module.css';
import type { PatternInput } from './pattern-draft';
import { testUrl, type UrlTestResult } from './url-test';

function resultText(result: UrlTestResult): string {
  switch (result.kind) {
    case 'empty':
      return '';
    case 'invalid':
      return t('optionsTestInvalid');
    case 'match':
      return t('optionsTestMatch', [String(result.number), result.pattern.value]);
    case 'draft':
      return t('optionsTestDraftMatch');
    case 'none':
      return t('optionsTestNoMatch');
    default:
      return assertNever(result);
  }
}

export type UrlTesterProps = {
  readonly patterns: readonly UrlPattern[];
  /** The pattern being typed in the Add form, checked too before it is added. */
  readonly draft: PatternInput;
};

/** Which pattern matches a typed URL, live while the patterns are edited (REQ-URL-007). */
export function UrlTester({ patterns, draft }: UrlTesterProps): ReactNode {
  const [url, setUrl] = useState('');
  const resultId = useId();
  const text = resultText(testUrl(url, patterns, draft));
  return (
    <div className={styles.tester}>
      <Field label={t('optionsTestUrl')}>
        {(control) => (
          <input
            {...control}
            type="url"
            value={url}
            spellCheck={false}
            aria-describedby={resultId}
            onChange={(event) => setUrl(event.target.value)}
          />
        )}
      </Field>
      <p id={resultId} aria-live="polite" className={styles.result}>
        {text}
      </p>
    </div>
  );
}
