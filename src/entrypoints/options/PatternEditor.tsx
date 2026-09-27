import type { ReactNode } from 'react';
import type { SiteGroup } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import type { Notify } from './notify';
import { PatternSection } from './PatternSection';
import { UrlTester } from './UrlTester';
import { useAddPattern } from './use-add-pattern';

/**
 * A site group's URL patterns, the live URL tester and the excludes (REQ-OPT-002, REQ-URL-007,
 * REQ-URL-008). Both lists are added to with an explicit Add; the tester reads the pattern being
 * typed too.
 */
export function PatternEditor({
  group,
  notify,
}: {
  readonly group: SiteGroup;
  readonly notify: Notify;
}): ReactNode {
  const patterns = useAddPattern(group.id, 'patterns');
  const excludes = useAddPattern(group.id, 'excludes');
  return (
    <>
      <PatternSection group={group} form={patterns} notify={notify}>
        <UrlTester group={group} draft={patterns.input} />
      </PatternSection>
      <PatternSection
        group={group}
        form={excludes}
        notify={notify}
        intro={<p>{t('optionsExcludesHelp')}</p>}
      />
    </>
  );
}
