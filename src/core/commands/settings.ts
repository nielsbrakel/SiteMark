import type { SiteMarkState, Theme } from '../model/schema';
import { notImplemented } from '../not-implemented';
import type { Result } from '../result';

export type SetTheme = { readonly type: 'setTheme'; readonly theme: Theme };

export function setTheme(_state: SiteMarkState, _command: SetTheme): Result<SiteMarkState, never> {
  return notImplemented();
}
