import type { ReactNode } from 'react';
import { notImplemented } from '@/core/not-implemented';

export type GrantAppProps = {
  /** `location.search` of the page: `?origins=…` (src/platform/grant-page.ts). */
  readonly search: string;
};

/** The grant page (D-229): asks for the sites in its link, on one Allow click. */
export function GrantApp(_props: GrantAppProps): ReactNode {
  return notImplemented();
}
