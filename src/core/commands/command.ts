import type { IdGen, SiteGroupId } from '../ids';

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

export type SiteGroupCommand =
  | CreateSiteGroup
  | RenameSiteGroup
  | DeleteSiteGroup
  | SetSiteGroupEnabled
  | MoveSiteGroup;

/** Everything an extension page can ask the background to change. */
export type Command = SiteGroupCommand;

/** The command with the given `type`, e.g. `CommandOf<'renameSiteGroup'>`. */
export type CommandOf<T extends Command['type']> = Extract<Command, { readonly type: T }>;

/** What reducers may use besides the state and the command. Only the background mints IDs. */
export type CommandDeps = { readonly idGen: IdGen };
