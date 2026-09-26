import type { Command, CommandNotice } from '../core/commands/command';
import type { ErrorCode } from '../core/errors';
import type { IdGen } from '../core/ids';
import type { SiteMarkState } from '../core/model/schema';
import { notImplemented } from '../core/not-implemented';
import type { Result } from '../core/result';
import type { Logger, StateRepo } from './ports';

/** A change the queue saved: the new revision and what to tell the user. */
export type Committed = {
  readonly revision: number;
  readonly notices: readonly CommandNotice[];
};

/** Changes the state without being a Command, e.g. an import merge (T-073). */
export type Transform<E> = (state: SiteMarkState) => Result<SiteMarkState, E>;

export type CommandQueueDeps = {
  readonly repo: StateRepo;
  readonly idGen: IdGen;
  readonly logger: Logger;
  /** Runs after every saved change, with the saved state (e.g. push render plans, T-066). */
  readonly onCommitted?: (state: SiteMarkState) => void | Promise<void>;
};

export type CommandQueue = {
  dispatch(command: Command): Promise<Result<Committed, ErrorCode>>;
  run<E>(transform: Transform<E>): Promise<Result<Committed, E | ErrorCode>>;
};

export function createCommandQueue(_deps: CommandQueueDeps): CommandQueue {
  return notImplemented();
}
