import type { IdGen, MarkId, PatternId, SiteGroupId } from '../ids';
import type { SiteOrigin } from '../model/defaults';
import type { MarkDraft, SiteMarkState, Theme } from '../model/schema';
import type { UrlPatternDraft } from '../url/match';

// Commands are the only way to change the state (D-220): an extension page sends one, and the
// background's queue applies it with a pure reducer, validates the result and bumps the revision.
// Reducers never mutate their input and return a Result with an error code (D-225).

/** Adds an empty, disabled site group at the bottom of the list (REQ-GRP-001). */
export type CreateSiteGroup = { readonly type: 'createSiteGroup'; readonly name: string };

export type RenameSiteGroup = {
  readonly type: 'renameSiteGroup';
  readonly id: SiteGroupId;
  readonly name: string;
};

export type DeleteSiteGroup = { readonly type: 'deleteSiteGroup'; readonly id: SiteGroupId };

/** Enabling needs at least one URL pattern (REQ-GRP-002, REQ-GRP-003). */
export type SetSiteGroupEnabled = {
  readonly type: 'setSiteGroupEnabled';
  readonly id: SiteGroupId;
  readonly enabled: boolean;
};

/**
 * Moves a site group so that it ends up at `toIndex`, clamped to the list (REQ-GRP-004). Move up/down
 * is `index - 1` / `index + 1`; drag and drop sends the drop position.
 */
export type MoveSiteGroup = {
  readonly type: 'moveSiteGroup';
  readonly id: SiteGroupId;
  readonly toIndex: number;
};

/**
 * Copies a site group to the bottom of the list with new IDs, named `<name> copy` (REQ-GRP-006).
 * The copy starts disabled: its origins may not be granted yet.
 */
export type DuplicateSiteGroup = { readonly type: 'duplicateSiteGroup'; readonly id: SiteGroupId };

export type SiteGroupCommand =
  | CreateSiteGroup
  | RenameSiteGroup
  | DeleteSiteGroup
  | SetSiteGroupEnabled
  | MoveSiteGroup
  | DuplicateSiteGroup;

/**
 * Adds a URL pattern at the end of a site group's list, in canonical form (REQ-GRP-002,
 * REQ-URL-003, REQ-URL-009). Adding a pattern does not enable the group.
 */
export type AddPattern = {
  readonly type: 'addPattern';
  readonly groupId: SiteGroupId;
  readonly draft: UrlPatternDraft;
};

/** Replaces a URL pattern in place; it keeps its ID. */
export type UpdatePattern = {
  readonly type: 'updatePattern';
  readonly groupId: SiteGroupId;
  readonly patternId: PatternId;
  readonly draft: UrlPatternDraft;
};

/** Removing the last URL pattern disables an enabled group, with a notice (REQ-GRP-002). */
export type RemovePattern = {
  readonly type: 'removePattern';
  readonly groupId: SiteGroupId;
  readonly patternId: PatternId;
};

/** Exclude patterns suppress a match (REQ-URL-008); same rules as URL patterns. */
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

export type PatternCommand =
  | AddPattern
  | UpdatePattern
  | RemovePattern
  | AddExclude
  | UpdateExclude
  | RemoveExclude;

/** Adds a mark at the end of a site group's list; the background gives it an ID. */
export type AddMark = {
  readonly type: 'addMark';
  readonly groupId: SiteGroupId;
  readonly mark: MarkDraft;
};

/** Replaces the whole mark (it may change its target); the mark keeps its ID. */
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

/** Moves a mark to `toIndex` within its group, clamped (like `MoveSiteGroup`; REQ-GRP-005). */
export type MoveMark = {
  readonly type: 'moveMark';
  readonly groupId: SiteGroupId;
  readonly markId: MarkId;
  readonly toIndex: number;
};

export type MarkCommand = AddMark | UpdateMark | RemoveMark | MoveMark;

/**
 * "Mark this site" (REQ-POP-006): adds the default group for the origin at the bottom. It adds a
 * new group every time, even when one for the same origin exists.
 */
export type MarkThisSite = { readonly type: 'markThisSite'; readonly origin: SiteOrigin };

/** REQ-OPT-004 */
export type SetTheme = { readonly type: 'setTheme'; readonly theme: Theme };

/** Everything an extension page can ask the background to change. */
export type Command = SiteGroupCommand | PatternCommand | MarkCommand | MarkThisSite | SetTheme;

/** The command with the given `type`, e.g. `CommandOf<'renameSiteGroup'>`. */
export type CommandOf<T extends Command['type']> = Extract<Command, { readonly type: T }>;

/** What reducers may use besides the state and the command. Only the background mints IDs. */
export type CommandDeps = { readonly idGen: IdGen };

/** Something the user should be told after a command succeeded; the UI translates it. */
export type CommandNotice =
  /** Removing its last URL pattern disabled the site group (REQ-GRP-002). */
  'siteGroupAutoDisabled';

/** A reducer's new state plus the notices for the user. */
export type CommandOutcome = {
  readonly state: SiteMarkState;
  readonly notices: readonly CommandNotice[];
};
