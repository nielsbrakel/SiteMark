import type { SiteMarkState } from '../model/schema';
import { notImplemented } from '../not-implemented';
import { ok, type Result } from '../result';
import type { CommandOf } from './command';

/** REQ-OPT-004: the options page's theme setting. */
export function setTheme(
  state: SiteMarkState,
  { theme }: CommandOf<'setTheme'>,
): Result<SiteMarkState, never> {
  return ok({ ...state, settings: { ...state.settings, theme } });
}

/** Deletes every site group and restores the default settings (REQ-OPT-005, Reset everything). */
export type ResetAll = { readonly type: 'resetAll' };

export function resetAll(_state: SiteMarkState, _command: ResetAll): Result<SiteMarkState, never> {
  return notImplemented();
}
