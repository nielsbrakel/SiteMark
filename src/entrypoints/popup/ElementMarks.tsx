import type { ReactNode } from 'react';
import type { MarkId } from '@/core/ids';
import type { ElementMark, Mark, SiteGroup } from '@/core/model/schema';
import type { TabStatus } from '@/core/render/status';
import { t } from '@/lib/i18n/browser-source';
import { Button } from '@/ui/components/Button';
import { CheckIcon, WarningIcon } from '@/ui/components/icons';
import styles from './ElementMarks.module.css';

export type ElementMarksProps = {
  /** An active group: its enabled element marks are in the tab's plan. */
  readonly group: SiteGroup;
  readonly status: TabStatus;
  /** Re-pick (REQ-PICK-007): the picker replaces this mark's selector. */
  readonly onRepick: (markId: MarkId) => void;
};

const isShownElementMark = (mark: Mark): mark is ElementMark =>
  mark.enabled && mark.target.kind === 'element';

function MarkItem({
  mark,
  found,
  onRepick,
}: {
  readonly mark: ElementMark;
  readonly found: boolean;
  readonly onRepick: (markId: MarkId) => void;
}) {
  const label = mark.label ?? mark.target.selector;
  return (
    <li className={styles.mark}>
      <span className={styles.label}>{label}</span>{' '}
      {found ? (
        <span className={styles.found}>
          <CheckIcon />
          {t('popupMarkFound')}
        </span>
      ) : (
        <>
          <span className={styles.notFound}>
            <WarningIcon />
            {t('popupMarkNotFound')}
          </span>{' '}
          <Button
            variant="quiet"
            aria-label={t('popupRepickLabel', label)}
            onClick={() => onRepick(mark.id)}
          >
            {t('popupRepick')}
          </Button>
        </>
      )}
    </li>
  );
}

/** Found or not found for each element mark the marker reported (REQ-POP-002). */
export function ElementMarks({ group, status, onRepick }: ElementMarksProps): ReactNode {
  const found = new Map(status.marks.map((mark) => [mark.markId, mark.found]));
  const marks = group.marks.filter(isShownElementMark).filter((mark) => found.has(mark.id));
  if (marks.length === 0) return null;
  return (
    <ul className={styles.list} aria-label={t('popupElementMarks', group.name)}>
      {marks.map((mark) => (
        <MarkItem
          key={mark.id}
          mark={mark}
          found={found.get(mark.id) === true}
          onRepick={onRepick}
        />
      ))}
    </ul>
  );
}
