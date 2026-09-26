import { notImplemented } from '@/core/not-implemented';
import type { Store } from '../config/stores';
import type { PageProps } from '../pages/page-props';

type InstallButtonsProps = { stores: readonly Store[]; t: PageProps['t'] };

/** One button per store: a link to the listing, or a disabled coming-soon button (REQ-PAGE-002). */
export function InstallButtons(_props: InstallButtonsProps): never {
  return notImplemented();
}
