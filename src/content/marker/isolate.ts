import type { Logger } from '../../app/ports';
import { err, ok, type Result } from '../../core/result';

/**
 * Runs one step of one effect so that its failure stays its own (REQ-RND-009): an exception is
 * logged (`[SiteMark]` prefix, by the Logger) and comes back as an error instead of propagating.
 */
export function isolate<T>(logger: Logger, what: string, run: () => T): Result<T, undefined> {
  try {
    return ok(run());
  } catch (error) {
    logger.error(`${what} failed`, error);
    return err(undefined);
  }
}
