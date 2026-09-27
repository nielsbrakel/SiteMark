import { emptyState } from '../model/defaults';
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

/**
 * REQ-OPT-005 Reset everything: no site groups and the default settings. The revision stays for
 * the dispatcher to bump, so pages see the reset as a newer state.
 */
export function resetAll(
  { revision }: SiteMarkState,
  _command: CommandOf<'resetAll'>,
): Result<SiteMarkState, never> {
  return ok({ ...emptyState(), revision });
}
