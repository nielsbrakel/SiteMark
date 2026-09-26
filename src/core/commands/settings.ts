import type { SiteMarkState } from '../model/schema';
import { ok, type Result } from '../result';
import type { CommandOf } from './command';

/** REQ-OPT-004: the options page's theme setting. */
export function setTheme(
  state: SiteMarkState,
  { theme }: CommandOf<'setTheme'>,
): Result<SiteMarkState, never> {
  return ok({ ...state, settings: { ...state.settings, theme } });
}
