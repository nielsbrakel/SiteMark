import type { ReactNode } from 'react';
import type { OptionsRoute } from '@/core/options-route';
import { assertNever } from '@/core/result';
import { type MessageKey, t } from '@/lib/i18n/browser-source';
import styles from './Layout.module.css';

type Page = 'groups' | 'settings' | 'data';

const PAGES: readonly { page: Page; href: string; label: MessageKey }[] = [
  { page: 'groups', href: '#/', label: 'optionsSiteGroups' },
  { page: 'settings', href: '#/settings', label: 'optionsSettings' },
  { page: 'data', href: '#/data', label: 'optionsData' },
];

/** Which top-level page a route belongs to; the welcome tab belongs to none. */
function pageOf(route: OptionsRoute | undefined): Page | undefined {
  if (!route) return 'groups';
  switch (route.page) {
    case 'group':
    case 'mark':
      return 'groups';
    case 'settings':
    case 'data':
      return route.page;
    case 'welcome':
      return undefined;
    default:
      return assertNever(route);
  }
}

/** Site groups · Settings · Data (design.md §5.2), with the current page marked. */
export function PageNav({ route }: { readonly route: OptionsRoute | undefined }): ReactNode {
  const current = pageOf(route);
  return (
    <nav aria-label={t('optionsPages')} className={styles.nav}>
      {PAGES.map(({ page, href, label }) => (
        <a key={page} href={href} aria-current={page === current ? 'page' : undefined}>
          {t(label)}
        </a>
      ))}
    </nav>
  );
}
