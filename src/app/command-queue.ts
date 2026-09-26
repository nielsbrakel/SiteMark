import { applyCommand } from '../core/commands/apply-command';
import type { Command, CommandNotice, CommandOutcome } from '../core/commands/command';
import type { ErrorCode } from '../core/errors';
import type { IdGen } from '../core/ids';
import { parseState, type SiteMarkState } from '../core/model/schema';
import { err, ok, type Result } from '../core/result';
import type { Logger, StateRepo } from './ports';

// The single writer (D-220, REQ-SEC-001, plan §3.1): a promise chain, so each change reads the
// state the previous one saved. Nothing is kept in memory between changes: the service worker may
// stop at any time, and the stored state is the only truth.

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

type Change<E> = (state: SiteMarkState) => Result<CommandOutcome, E>;

/** Like applyCommand for a Transform: the next revision, validated by the state schema. */
function transformed<E>(
  state: SiteMarkState,
  transform: Transform<E>,
): Result<CommandOutcome, E | ErrorCode> {
  const next = transform(state);
  if (!next.ok) return next;
  const parsed = parseState({ ...next.value, revision: state.revision + 1 });
  if (!parsed.ok) return err('commandProducedInvalidState');
  return ok({ state: parsed.value, notices: [] });
}

async function notify(deps: CommandQueueDeps, state: SiteMarkState): Promise<void> {
  try {
    await deps.onCommitted?.(state);
  } catch (error) {
    deps.logger.error('A saved change could not be passed on', error);
  }
}

async function commit<E>(
  deps: CommandQueueDeps,
  change: Change<E>,
): Promise<Result<Committed, E | ErrorCode>> {
  const loaded = await deps.repo.load();
  if (loaded.mode === 'readOnly') return err('stateReadOnly');
  const outcome = change(loaded.state);
  if (!outcome.ok) return outcome;
  const { state, notices } = outcome.value;
  const saved = await deps.repo.save(state);
  if (!saved.ok) return err(saved.error);
  await notify(deps, state);
  return ok({ revision: state.revision, notices });
}

/**
 * Serializes every change of the state: read the fresh state → apply → validate → save (refused
 * while read-only) → `onCommitted`. A change resolves after its hook ran, so the next one never
 * overtakes its render-plan push. A failing change never blocks the ones after it.
 */
export function createCommandQueue(deps: CommandQueueDeps): CommandQueue {
  let tail: Promise<unknown> = Promise.resolve();
  const enqueue = <E>(change: Change<E>): Promise<Result<Committed, E | ErrorCode>> => {
    const job = tail.then(() => commit(deps, change));
    tail = job.catch(() => undefined);
    return job;
  };
  return {
    dispatch: (command) => enqueue((state) => applyCommand(state, command, deps)),
    run: (transform) => enqueue((state) => transformed(state, transform)),
  };
}
