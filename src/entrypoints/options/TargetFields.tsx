import { type ReactNode, useState } from 'react';
import type { Mark, SiteGroup } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { Segmented } from '@/ui/components/Segmented';
import { asElementMark, asPageMark } from './mark-drafts';
import { updateMark } from './mark-update';
import type { Notify } from './notify';
import { SelectorField } from './SelectorField';

type TargetKind = Mark['target']['kind'];

export type TargetFieldsProps = {
  readonly group: SiteGroup;
  readonly mark: Mark;
  readonly notify: Notify;
};

/**
 * The mark's target (REQ-OPT-003): the page, or an element and its selector. A page mark becomes an
 * element mark only once it has a valid selector; an element mark becomes a page mark at once.
 */
export function TargetFields({ group, mark, notify }: TargetFieldsProps): ReactNode {
  const [target, setTarget] = useState<TargetKind>(mark.target.kind);
  const choose = async (kind: TargetKind) => {
    setTarget(kind);
    if (kind !== 'page' || mark.target.kind === 'page') return;
    const refused = await updateMark(group, mark, asPageMark(mark, group.name));
    if (refused) notify({ text: refused });
  };
  const options = [
    { value: 'page', label: t('optionsTargetPage') },
    { value: 'element', label: t('optionsTargetElement') },
  ] as const;
  return (
    <>
      <Segmented
        label={t('optionsTarget')}
        options={options}
        value={target}
        onChange={(kind) => void choose(kind)}
      />
      {target === 'element' && (
        <SelectorField
          selector={mark.target.kind === 'element' ? mark.target.selector : ''}
          onSave={(selector) => updateMark(group, mark, asElementMark(mark, selector))}
        />
      )}
    </>
  );
}
