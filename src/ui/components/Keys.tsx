import type { ReactNode } from 'react';
import { notImplemented } from '@/core/not-implemented';

/** A keyboard shortcut as one key cap per key, e.g. `Alt+Shift+M` or `⌥⇧M`. */
export function Keys(_props: { readonly shortcut: string }): ReactNode {
  return notImplemented();
}
