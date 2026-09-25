import type { SiteGroupErrorCode } from '../errors';
import type { MarkId, SiteGroupId } from '../ids';
import type { ElementMark, PageMark, SiteMarkState } from '../model/schema';
import { notImplemented } from '../not-implemented';
import type { Result } from '../result';
import type { CommandDeps } from './command';

export type MarkDraft = Omit<PageMark, 'id'> | Omit<ElementMark, 'id'>;

export type AddMark = {
  readonly type: 'addMark';
  readonly groupId: SiteGroupId;
  readonly mark: MarkDraft;
};

export type UpdateMark = {
  readonly type: 'updateMark';
  readonly groupId: SiteGroupId;
  readonly markId: MarkId;
  readonly mark: MarkDraft;
};

export type RemoveMark = {
  readonly type: 'removeMark';
  readonly groupId: SiteGroupId;
  readonly markId: MarkId;
};

export type MoveMark = {
  readonly type: 'moveMark';
  readonly groupId: SiteGroupId;
  readonly markId: MarkId;
  readonly toIndex: number;
};

type MarkResult = Result<SiteMarkState, SiteGroupErrorCode>;

export function addMark(_state: SiteMarkState, _command: AddMark, _deps: CommandDeps): MarkResult {
  return notImplemented();
}

export function updateMark(_state: SiteMarkState, _command: UpdateMark): MarkResult {
  return notImplemented();
}

export function removeMark(_state: SiteMarkState, _command: RemoveMark): MarkResult {
  return notImplemented();
}

export function moveMark(_state: SiteMarkState, _command: MoveMark): MarkResult {
  return notImplemented();
}
