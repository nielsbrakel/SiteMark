import type { ErrorCode } from '../errors';
import { parseState, type SiteMarkState } from '../model/schema';
import { assertNever, err, ok, type Result } from '../result';
import type {
  Command,
  CommandDeps,
  CommandOutcome,
  MarkCommand,
  MarkThisSite,
  PatternCommand,
  SetTheme,
  SiteGroupCommand,
} from './command';
import { duplicateSiteGroup } from './duplicate-group';
import { addExclude, removeExclude, updateExclude } from './excludes';
import {
  createSiteGroup,
  deleteSiteGroup,
  moveSiteGroup,
  renameSiteGroup,
  setSiteGroupEnabled,
} from './groups';
import { markThisSite } from './mark-this-site';
import { addMark, moveMark, removeMark, updateMark } from './marks';
import { addPattern, removePattern, updatePattern } from './patterns';
import { setTheme } from './settings';

// The single entry point for changing the state (D-220, REQ-SEC-001). The background's command
// queue calls it with the fresh state and saves what it returns.

type StateResult = Result<SiteMarkState, ErrorCode>;
type OutcomeResult = Result<CommandOutcome, ErrorCode>;

function withoutNotices(result: StateResult): OutcomeResult {
  return result.ok ? ok({ state: result.value, notices: [] }) : result;
}

function reduceGroup(
  state: SiteMarkState,
  command: SiteGroupCommand | MarkThisSite | SetTheme,
  deps: CommandDeps,
): StateResult {
  switch (command.type) {
    case 'createSiteGroup':
      return createSiteGroup(state, command, deps);
    case 'renameSiteGroup':
      return renameSiteGroup(state, command);
    case 'deleteSiteGroup':
      return deleteSiteGroup(state, command);
    // biome-ignore lint/security/noSecrets: a command type, not a secret.
    case 'setSiteGroupEnabled':
      return setSiteGroupEnabled(state, command);
    case 'moveSiteGroup':
      return moveSiteGroup(state, command);
    case 'duplicateSiteGroup':
      return duplicateSiteGroup(state, command, deps);
    case 'markThisSite':
      return markThisSite(state, command, deps);
    case 'setTheme':
      return setTheme(state, command);
    default:
      return assertNever(command);
  }
}

function reducePatterns(
  state: SiteMarkState,
  command: PatternCommand,
  deps: CommandDeps,
): OutcomeResult {
  switch (command.type) {
    case 'addPattern':
      return withoutNotices(addPattern(state, command, deps));
    case 'updatePattern':
      return withoutNotices(updatePattern(state, command));
    case 'removePattern':
      return removePattern(state, command);
    case 'addExclude':
      return withoutNotices(addExclude(state, command, deps));
    case 'updateExclude':
      return withoutNotices(updateExclude(state, command));
    case 'removeExclude':
      return withoutNotices(removeExclude(state, command));
    default:
      return assertNever(command);
  }
}

function reduceMarks(state: SiteMarkState, command: MarkCommand, deps: CommandDeps): StateResult {
  switch (command.type) {
    case 'addMark':
      return addMark(state, command, deps);
    case 'updateMark':
      return updateMark(state, command);
    case 'removeMark':
      return removeMark(state, command);
    case 'moveMark':
      return moveMark(state, command);
    default:
      return assertNever(command);
  }
}

function reduce(state: SiteMarkState, command: Command, deps: CommandDeps): OutcomeResult {
  switch (command.type) {
    case 'createSiteGroup':
    case 'renameSiteGroup':
    case 'deleteSiteGroup':
    // biome-ignore lint/security/noSecrets: a command type, not a secret.
    case 'setSiteGroupEnabled':
    case 'moveSiteGroup':
    case 'duplicateSiteGroup':
    case 'markThisSite':
    case 'setTheme':
      return withoutNotices(reduceGroup(state, command, deps));
    case 'addPattern':
    case 'updatePattern':
    case 'removePattern':
    case 'addExclude':
    case 'updateExclude':
    case 'removeExclude':
      return reducePatterns(state, command, deps);
    case 'addMark':
    case 'updateMark':
    case 'removeMark':
    case 'moveMark':
      return withoutNotices(reduceMarks(state, command, deps));
    default:
      return assertNever(command);
  }
}

/**
 * Applies `command` with its reducer, bumps `revision` by exactly 1 and validates the result with
 * the state schema, so a reducer bug is never saved: such a state is refused with
 * `commandProducedInvalidState`. The returned state is the one the schema read. Reducer refusals
 * pass through unchanged, and a refused command bumps nothing.
 */
export function applyCommand(
  state: SiteMarkState,
  command: Command,
  deps: CommandDeps,
): Result<CommandOutcome, ErrorCode> {
  const reduced = reduce(state, command, deps);
  if (!reduced.ok) return reduced;
  const next = parseState({ ...reduced.value.state, revision: state.revision + 1 });
  if (!next.ok) return err('commandProducedInvalidState');
  return ok({ state: next.value, notices: reduced.value.notices });
}
