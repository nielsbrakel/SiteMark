import type { RegexErrorCode, SiteGroupErrorCode, UrlPatternErrorCode } from '../errors';
import type { PatternId, SiteGroupId } from '../ids';
import type { SiteMarkState } from '../model/schema';
import { notImplemented } from '../not-implemented';
import type { Result } from '../result';
import type { UrlPatternDraft } from '../url/match';
import type { CommandDeps } from './command';

export type AddPattern = {
  readonly type: 'addPattern';
  readonly groupId: SiteGroupId;
  readonly draft: UrlPatternDraft;
};

export type UpdatePattern = {
  readonly type: 'updatePattern';
  readonly groupId: SiteGroupId;
  readonly patternId: PatternId;
  readonly draft: UrlPatternDraft;
};

export type RemovePattern = {
  readonly type: 'removePattern';
  readonly groupId: SiteGroupId;
  readonly patternId: PatternId;
};

export type CommandNotice = 'siteGroupAutoDisabled';

export type CommandOutcome = {
  readonly state: SiteMarkState;
  readonly notices: readonly CommandNotice[];
};

type PatternErrorCode = SiteGroupErrorCode | UrlPatternErrorCode | RegexErrorCode;

export function addPattern(
  _state: SiteMarkState,
  _command: AddPattern,
  _deps: CommandDeps,
): Result<SiteMarkState, PatternErrorCode> {
  return notImplemented();
}

export function updatePattern(
  _state: SiteMarkState,
  _command: UpdatePattern,
): Result<SiteMarkState, PatternErrorCode> {
  return notImplemented();
}

export function removePattern(
  _state: SiteMarkState,
  _command: RemovePattern,
): Result<CommandOutcome, PatternErrorCode> {
  return notImplemented();
}
