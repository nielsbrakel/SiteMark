import { type ReactNode, useId, useMemo } from 'react';
import type { Mark, MarkDraft, SiteGroup } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { MarkPreview } from '@/ui/components/MarkPreview';
import { ColorFields } from '@/ui/components/mark-form/ColorFields';
import { EffectsFieldset } from '@/ui/components/mark-form/EffectsFieldset';
import { TextColorField } from '@/ui/components/mark-form/TextColorField';
import styles from './MarkEditor.module.css';
import { draftOf } from './mark-drafts';
import { updateMark } from './mark-update';
import type { Notify } from './notify';
import { PREVIEW_ADDRESS, previewPlan } from './preview-plan';
import { groupHref } from './routes';
import { TargetFields } from './TargetFields';

export type MarkEditorProps = {
  readonly group: SiteGroup;
  readonly mark: Mark;
  readonly notify: Notify;
};

/**
 * The mark editor (REQ-OPT-003): target and selector, colors, the effects of the target, and a
 * live preview (REQ-MARK-013). Every change is saved as an updateMark command.
 */
export function MarkEditor({ group, mark, notify }: MarkEditorProps): ReactNode {
  const headingId = useId();
  const plan = useMemo(() => previewPlan(group, mark), [group, mark]);
  const save = (change: Partial<MarkDraft>) =>
    updateMark(group, mark, { ...draftOf(mark), ...change } as MarkDraft);
  const saveEffects = async (effects: Mark['effects']) => {
    const refused = await save({ effects });
    if (refused) notify({ text: refused });
  };
  return (
    <section className={styles.editor} aria-labelledby={headingId}>
      <div className={styles.header}>
        <h3 id={headingId}>{t('optionsEditMark')}</h3>
        <a href={groupHref(group.id)}>{t('optionsCloseMark')}</a>
      </div>
      <TargetFields group={group} mark={mark} notify={notify} />
      <ColorFields color={mark.color} onSave={(color) => save({ color })} />
      <TextColorField
        color={mark.color}
        textColor={mark.textColor}
        onSave={(textColor) => save({ textColor })}
      />
      <EffectsFieldset
        target={mark.target.kind}
        effects={mark.effects}
        groupName={group.name}
        onSave={(effects) => void saveEffects(effects)}
      />
      <MarkPreview
        plan={plan}
        label={t('optionsPreview')}
        pageTitle={t('previewPageTitle')}
        address={PREVIEW_ADDRESS}
        labels={{
          collapseBanner: t('markerCollapseBanner'),
          expandBanner: t('markerExpandBanner'),
        }}
      />
    </section>
  );
}
