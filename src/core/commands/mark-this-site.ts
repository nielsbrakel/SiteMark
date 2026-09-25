import type { SiteGroupErrorCode, UrlPatternErrorCode } from '../errors';
import type { SiteOrigin } from '../model/defaults';
import type { SiteMarkState } from '../model/schema';
import { notImplemented } from '../not-implemented';
import type { Result } from '../result';
import type { CommandDeps } from './command';

export type MarkThisSite = { readonly type: 'markThisSite'; readonly origin: SiteOrigin };

export function markThisSite(
  _state: SiteMarkState,
  _command: MarkThisSite,
  _deps: CommandDeps,
): Result<SiteMarkState, SiteGroupErrorCode | UrlPatternErrorCode> {
  return notImplemented();
}
