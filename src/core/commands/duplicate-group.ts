import type { SiteGroupErrorCode } from '../errors';
import type { SiteGroupId } from '../ids';
import type { SiteMarkState } from '../model/schema';
import { notImplemented } from '../not-implemented';
import type { Result } from '../result';
import type { CommandDeps } from './command';

export type DuplicateSiteGroup = { readonly type: 'duplicateSiteGroup'; readonly id: SiteGroupId };

export function duplicateSiteGroup(
  _state: SiteMarkState,
  _command: DuplicateSiteGroup,
  _deps: CommandDeps,
): Result<SiteMarkState, SiteGroupErrorCode> {
  return notImplemented();
}
