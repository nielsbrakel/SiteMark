import type { ReactNode } from 'react';
import { notImplemented } from '@/core/not-implemented';
import type { PageProps } from './page-props';

type ChangelogProps = Pick<PageProps, 't' | 'locale'> & { source: string | undefined };

export function Changelog(_: ChangelogProps): ReactNode {
  return notImplemented();
}
