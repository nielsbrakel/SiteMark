import { useCallback, useState } from 'react';
import type { Committed } from '../../app/command-queue';
import type { MessagingError } from '../../app/protocol';
import type { Command } from '../../core/commands/command';
import type { ErrorCode } from '../../core/errors';
import type { Result } from '../../core/result';
import { sendToBackground } from '../../platform/send-message';

/** Why a command didn't commit: the core refused it (`ErrorCode`) or the message failed. */
export type CommandError = ErrorCode | MessagingError;

export type CommandRunner = {
  readonly send: (command: Command) => Promise<Result<Committed, CommandError>>;
  /** True while at least one command is on its way. */
  readonly isPending: boolean;
  /** The error of the last command that finished; cleared by the next success. */
  readonly error: CommandError | undefined;
};

/**
 * Sends one command to the background, the only writer (D-220), and flattens its reply. Usable in
 * a click handler after a synchronous `permissions.request` (D-229).
 */
export async function sendCommand(command: Command): Promise<Result<Committed, CommandError>> {
  const reply = await sendToBackground('command', command);
  return reply.ok ? reply.value : reply;
}

/** `sendCommand` with the pending state and the last error, for forms and buttons. */
export function useCommand(): CommandRunner {
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<CommandError>();
  const send = useCallback(async (command: Command) => {
    setPending((count) => count + 1);
    const result = await sendCommand(command);
    setPending((count) => count - 1);
    setError(result.ok ? undefined : result.error);
    return result;
  }, []);
  return { send, isPending: pending > 0, error };
}
