import type { ErrorCode } from '../../core/errors';
import { notImplemented } from '../../core/not-implemented';
import type { Result } from '../../core/result';
import type { CommandQueue, Committed } from '../command-queue';
import type { MarkThisSiteRequest } from '../protocol';
import type { GrantDeps } from './grant';

export type MarkThisSiteDeps = GrantDeps & { readonly queue: Pick<CommandQueue, 'dispatch'> };

/** "Mark this site" in the background (REQ-POP-006, D-229). */
export async function markThisSite(
  _deps: MarkThisSiteDeps,
  _request: MarkThisSiteRequest,
): Promise<Result<Committed, ErrorCode>> {
  return notImplemented();
}
