import type { ReactNode } from 'react';
import { notImplemented } from '@/core/not-implemented';

export type PopupAppProps = {
  /** `location.search`: `?tabId=` picks the tab in e2e builds (src/ui/hooks/use-current-tab.ts). */
  readonly search?: string;
};

/** The toolbar popup (REQ-POP-001…007, design.md §5.1): the site groups on the current tab. */
export function PopupApp(_props: PopupAppProps): ReactNode {
  return notImplemented();
}
