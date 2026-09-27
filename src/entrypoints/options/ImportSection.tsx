import { type ReactNode, useId } from 'react';
import { t } from '@/lib/i18n/browser-source';
import { Field } from '@/ui/components/Field';
import { ImportPreview } from './ImportPreview';
import styles from './Pane.module.css';
import { useImport } from './use-import';

/**
 * Import (REQ-DATA-004, REQ-DATA-005): choose a file, see what it changes, then Merge or Replace
 * with one prompt for its new sites. An invalid file shows why and changes nothing.
 */
export function ImportSection(): ReactNode {
  const headingId = useId();
  const { state, choose, apply } = useImport();
  return (
    <section className={styles.pane} aria-labelledby={headingId}>
      <h3 id={headingId}>{t('optionsImportHeading')}</h3>
      <Field label={t('optionsChooseFile')}>
        {(control) => (
          <input
            {...control}
            type="file"
            accept=".json,application/json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void choose(file);
            }}
          />
        )}
      </Field>
      {state.status === 'error' && <p role="alert">{state.message}</p>}
      {state.status === 'previewed' && (
        <ImportPreview file={state.file} onApply={(mode) => apply(state.file, mode)} />
      )}
      <p aria-live="polite">{state.status === 'imported' ? t('optionsImported') : ''}</p>
    </section>
  );
}
