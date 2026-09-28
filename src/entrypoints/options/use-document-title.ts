import { useEffect } from 'react';
import type { SiteGroup } from '@/core/model/schema';
import type { OptionsRoute } from '@/core/options-route';
import { assertNever } from '@/core/result';
import { t } from '@/lib/i18n/browser-source';

/** The open page's name: the site group in the pane, Settings, Data or the welcome title. */
function pageName(route: OptionsRoute | undefined, group: SiteGroup | undefined): string {
  switch (route?.page) {
    case undefined:
    case 'group':
    case 'mark':
      return group?.name ?? t('optionsSiteGroups');
    case 'settings':
      return t('optionsSettings');
    case 'data':
      return t('optionsData');
    case 'welcome':
      return t('welcomeTitle');
    default:
      return assertNever(route);
  }
}

/** Names the open page in the tab title, e.g. "Production – SiteMark settings" (WCAG 2.4.2). */
export function useDocumentTitle(
  route: OptionsRoute | undefined,
  group: SiteGroup | undefined,
): void {
  const name = pageName(route, group);
  useEffect(() => {
    document.title = t('optionsDocumentTitle', name);
  }, [name]);
}
