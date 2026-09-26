import type { ErrorCode } from '../../core/errors';
import type { IdGen, MarkId } from '../../core/ids';
import { notImplemented } from '../../core/not-implemented';
import type { Result } from '../../core/result';
import type { CommandQueue } from '../command-queue';
import type { ContentSender, SavePick } from '../protocol';

export type SavePickDeps = {
  readonly queue: Pick<CommandQueue, 'run'>;
  readonly idGen: IdGen;
};

/** The picker's save intent (REQ-PICK-005, REQ-PICK-007, REQ-SEC-001). */
export async function savePick(
  _deps: SavePickDeps,
  _pick: SavePick,
  _sender: ContentSender,
): Promise<Result<MarkId, ErrorCode>> {
  return notImplemented();
}
