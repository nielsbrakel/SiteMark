import type { Theme } from '../../core/model/schema';
import { notImplemented } from '../../core/not-implemented';

export type ResolvedTheme = 'light' | 'dark';

export function useTheme(_theme: Theme | undefined, _root?: HTMLElement): ResolvedTheme {
  return notImplemented();
}
