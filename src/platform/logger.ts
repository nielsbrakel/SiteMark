import type { Logger } from '../app/ports';
import { notImplemented } from '../core/not-implemented';

/** Where log lines go: the console, or a spy in tests. */
export type LogSink = Pick<Console, 'warn' | 'error'>;

/** The Logger adapter: every line starts with `[SiteMark]` (D-225). */
export function createConsoleLogger(_sink: LogSink = globalThis.console): Logger {
  return notImplemented();
}
