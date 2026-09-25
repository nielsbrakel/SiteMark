import type { SiteGroupErrorCode } from '../errors';
import type { IdGen, SiteGroupId } from '../ids';
import type { SiteMarkState } from '../model/schema';
import { notImplemented } from '../not-implemented';
import type { Result } from '../result';

export type CommandDeps = { readonly idGen: IdGen };

export type CreateSiteGroup = { readonly type: 'createSiteGroup'; readonly name: string };
export type RenameSiteGroup = {
  readonly type: 'renameSiteGroup';
  readonly id: SiteGroupId;
  readonly name: string;
};
export type DeleteSiteGroup = { readonly type: 'deleteSiteGroup'; readonly id: SiteGroupId };
export type SetSiteGroupEnabled = {
  readonly type: 'setSiteGroupEnabled';
  readonly id: SiteGroupId;
  readonly enabled: boolean;
};
export type MoveSiteGroup = {
  readonly type: 'moveSiteGroup';
  readonly id: SiteGroupId;
  readonly toIndex: number;
};

type GroupResult = Result<SiteMarkState, SiteGroupErrorCode>;

export function createSiteGroup(
  _state: SiteMarkState,
  _cmd: CreateSiteGroup,
  _deps: CommandDeps,
): GroupResult {
  return notImplemented();
}

export function renameSiteGroup(_state: SiteMarkState, _cmd: RenameSiteGroup): GroupResult {
  return notImplemented();
}

export function deleteSiteGroup(_state: SiteMarkState, _cmd: DeleteSiteGroup): GroupResult {
  return notImplemented();
}

export function setSiteGroupEnabled(_state: SiteMarkState, _cmd: SetSiteGroupEnabled): GroupResult {
  return notImplemented();
}

export function moveSiteGroup(_state: SiteMarkState, _cmd: MoveSiteGroup): GroupResult {
  return notImplemented();
}
