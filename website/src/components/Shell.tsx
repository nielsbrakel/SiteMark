import type { ReactNode } from 'react';
import { notImplemented } from '@/core/not-implemented';
import type { Locale } from '../i18n/locales';
import type { PageProps } from '../pages/page-props';
import type { Route } from '../routes/routes';

export type ShellProps = {
  /** The route of the page being shown (marked with aria-current). */
  route: Route;
  locale: Locale;
  /** The routes that have a page; only these are linked (REQ-PAGE-007). */
  routes: readonly Route[];
  t: PageProps['t'];
  /** The page content, rendered inside <main>. */
  children: ReactNode;
};

/** The frame of every page: skip link, header, main and footer (REQ-PAGE-007). */
export function Shell(_props: ShellProps): ReactNode {
  return notImplemented();
}
