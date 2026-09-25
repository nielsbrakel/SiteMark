import type { ErrorCode } from '../errors';
import type { SiteMarkState } from '../model/schema';
import { notImplemented } from '../not-implemented';
import type { Result } from '../result';
import type { Command, CommandDeps, CommandOutcome } from './command';

export function applyCommand(
  _state: SiteMarkState,
  _command: Command,
  _deps: CommandDeps,
): Result<CommandOutcome, ErrorCode> {
  return notImplemented();
}
