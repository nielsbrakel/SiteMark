import type { Committed } from '../../app/command-queue';
import type { MessagingError } from '../../app/protocol';
import type { Command } from '../../core/commands/command';
import type { ErrorCode } from '../../core/errors';
import { notImplemented } from '../../core/not-implemented';
import type { Result } from '../../core/result';

/** Why a command didn't commit: the core refused it (`ErrorCode`) or the message failed. */
export type CommandError = ErrorCode | MessagingError;

export type CommandRunner = {
  readonly send: (command: Command) => Promise<Result<Committed, CommandError>>;
  /** True while at least one command is on its way. */
  readonly isPending: boolean;
  /** The error of the last command that finished; cleared by the next success. */
  readonly error: CommandError | undefined;
};

export function sendCommand(_command: Command): Promise<Result<Committed, CommandError>> {
  return notImplemented();
}

export function useCommand(): CommandRunner {
  return notImplemented();
}
