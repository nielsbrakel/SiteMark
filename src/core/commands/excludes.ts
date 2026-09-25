import type { RegexErrorCode, SiteGroupErrorCode, UrlPatternErrorCode } from '../errors';
import type { PatternId, SiteGroupId } from '../ids';
import type { SiteMarkState } from '../model/schema';
import { notImplemented } from '../not-implemented';
import type { Result } from '../result';
import type { UrlPatternDraft } from '../url/match';
import type { CommandDeps } from './command';

export type AddExclude = {
  readonly type: 'addExclude';
  readonly groupId: SiteGroupId;
  readonly draft: UrlPatternDraft;
};

export type UpdateExclude = {
  readonly type: 'updateExclude';
  readonly groupId: SiteGroupId;
  readonly patternId: PatternId;
  readonly draft: UrlPatternDraft;
};

export type RemoveExclude = {
  readonly type: 'removeExclude';
  readonly groupId: SiteGroupId;
  readonly patternId: PatternId;
};

type PatternErrorCode = SiteGroupErrorCode | UrlPatternErrorCode | RegexErrorCode;

export function addExclude(
  _state: SiteMarkState,
  _command: AddExclude,
  _deps: CommandDeps,
): Result<SiteMarkState, PatternErrorCode> {
  return notImplemented();
}

export function updateExclude(
  _state: SiteMarkState,
  _command: UpdateExclude,
): Result<SiteMarkState, PatternErrorCode> {
  return notImplemented();
}

export function removeExclude(
  _state: SiteMarkState,
  _command: RemoveExclude,
): Result<SiteMarkState, PatternErrorCode> {
  return notImplemented();
}
