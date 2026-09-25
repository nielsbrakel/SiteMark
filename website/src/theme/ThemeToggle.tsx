import type { ReactNode } from 'react';
import { notImplemented } from '@/core/not-implemented';
import type { PageProps } from '../pages/page-props';

type ThemeToggleProps = { t: PageProps['t'] };

/** Auto / Light / Dark, stored in localStorage; hidden without JavaScript (REQ-WEBUX-002). */
export function ThemeToggle(_props: ThemeToggleProps): ReactNode {
  return notImplemented();
}
