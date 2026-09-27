import { type ReactNode, useId, useState } from 'react';
import type { Mark, MarkDraft, SiteGroup } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { Segmented } from '@/ui/components/Segmented';
import { sendCommand } from '@/ui/hooks/use-command';
import { commandErrorText } from './command-error';
import styles from './MarkEditor.module.css';
import { asElementMark, asPageMark } from './mark-drafts';
import type { Notify } from './notify';
import { groupHref } from './routes';
import { SelectorField } from './SelectorField';

type TargetKind = Mark['target']['kind'];

export type MarkEditorProps = {
  readonly group: SiteGroup;
  readonly mark: Mark;
  readonly notify: Notify;
};

/** Sends updateMark; the refusal text, if any. */
async function update(group: SiteGroup, mark: Mark, draft: MarkDraft): Promise<string | undefined> {
  const command = { type: 'updateMark', groupId: group.id, markId: mark.id, mark: draft } as const;
  const result = await sendCommand(command);
  return result.ok ? undefined : commandErrorText(result.error);
}

/**
 * The mark editor (REQ-OPT-003): the target, and for an element its selector. A page mark becomes
 * an element mark only once it has a valid selector; an element mark becomes a page mark at once.
 */
export function MarkEditor({ group, mark, notify }: MarkEditorProps): ReactNode {
  const headingId = useId();
  const [target, setTarget] = useState<TargetKind>(mark.target.kind);
  const chooseTarget = async (kind: TargetKind) => {
    setTarget(kind);
    if (kind !== 'page' || mark.target.kind === 'page') return;
    const refused = await update(group, mark, asPageMark(mark, group.name));
    if (refused) notify({ text: refused });
  };
  const options = [
    { value: 'page', label: t('optionsTargetPage') },
    { value: 'element', label: t('optionsTargetElement') },
  ] as const;
  return (
    <section className={styles.editor} aria-labelledby={headingId}>
      <div className={styles.header}>
        <h3 id={headingId}>{t('optionsEditMark')}</h3>
        <a href={groupHref(group.id)}>{t('optionsCloseMark')}</a>
      </div>
      <Segmented
        label={t('optionsTarget')}
        options={options}
        value={target}
        onChange={(kind) => void chooseTarget(kind)}
      />
      {target === 'element' && (
        <SelectorField
          selector={mark.target.kind === 'element' ? mark.target.selector : ''}
          onSave={(selector) => update(group, mark, asElementMark(mark, selector))}
        />
      )}
    </section>
  );
}
