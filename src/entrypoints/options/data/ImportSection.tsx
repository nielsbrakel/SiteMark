import { type ReactNode, useId } from 'react';
import { t } from '@/lib/i18n/browser-source';
import { DropZone } from '@/ui/components/DropZone';
import { Field } from '@/ui/components/Field';
import styles from '../Pane.module.css';
import { ImportPreview } from './ImportPreview';
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
          <DropZone
            control={control}
            accept=".json,application/json"
            dropText={t('optionsDropHere')}
            dragText={t('optionsDropRelease')}
            hint={t('optionsDropOr')}
            onFile={(file) => void choose(file)}
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
