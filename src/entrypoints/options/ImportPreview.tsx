import { type ReactNode, useState } from 'react';
import type { ImportMode } from '@/app/protocol';
import { t, tp } from '@/lib/i18n/browser-source';
import { Button } from '@/ui/components/Button';
import { Dialog } from '@/ui/components/Dialog';
import { Segmented } from '@/ui/components/Segmented';
import styles from './Pane.module.css';
import type { PreviewedFile } from './use-import';

export type ImportPreviewProps = {
  readonly file: PreviewedFile;
  /** Called synchronously in the Import (or dialog's Replace) click. */
  readonly onApply: (mode: ImportMode) => void;
};

function Summary({ file }: { readonly file: PreviewedFile }): ReactNode {
  const { updated, added, originsToRequest, regexPatterns } = file.summary;
  return (
    <>
      <p>{t('optionsImportSummary', [tp('importUpdated', updated), tp('importAdded', added)])}</p>
      {originsToRequest.length > 0 && <p>{tp('importOrigins', originsToRequest.length)}</p>}
      {regexPatterns.length > 0 && (
        <div className="sm-well">
          <p>{t('optionsImportRegexes')}</p>
          <ul className={styles.regexes}>
            {regexPatterns.map(({ pattern }) => (
              <li key={pattern.id}>
                <code translate="no">{pattern.value}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/**
 * The import preview (REQ-DATA-004): what the file changes, its regex patterns, Merge or Replace,
 * and Import. Replace asks for confirmation first.
 */
export function ImportPreview({ file, onApply }: ImportPreviewProps): ReactNode {
  const [mode, setMode] = useState<ImportMode>('merge');
  const [isConfirming, setConfirming] = useState(false);
  const modes = [
    { value: 'merge', label: t('importMerge') },
    { value: 'replace', label: t('importReplace') },
  ] as const;
  const replace = () => {
    setConfirming(false);
    onApply('replace');
  };
  return (
    <>
      <Summary file={file} />
      <Segmented label={t('optionsImportMode')} options={modes} value={mode} onChange={setMode} />
      <p>{t(mode === 'merge' ? 'optionsImportMergeHelp' : 'optionsImportReplaceHelp')}</p>
      <div>
        <Button
          variant="primary"
          onClick={() => (mode === 'merge' ? onApply('merge') : setConfirming(true))}
        >
          {t('optionsImport')}
        </Button>
      </div>
      <Dialog
        open={isConfirming}
        onClose={() => setConfirming(false)}
        title={t('optionsReplaceTitle')}
        actions={
          <>
            <Button onClick={() => setConfirming(false)}>{t('optionsCancel')}</Button>
            <Button variant="primary" onClick={replace}>
              {t('optionsReplace')}
            </Button>
          </>
        }
      >
        <p>{t('optionsReplaceBody')}</p>
      </Dialog>
    </>
  );
}
