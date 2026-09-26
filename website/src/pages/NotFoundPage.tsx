import { notImplemented } from '@/core/not-implemented';
import type { Route } from '../routes/routes';
import type { PageProps } from './page-props';

type NotFoundPageProps = {
  en: PageProps['t'];
  nl: PageProps['t'];
  /** The routes that have a page: only these are linked. */
  routes: readonly Route[];
};

/** The bilingual not-found page (REQ-PAGE-006): English and Dutch, each with its links. */
export function NotFoundPage(_props: NotFoundPageProps): never {
  return notImplemented();
}
