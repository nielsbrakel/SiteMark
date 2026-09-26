import type { Logger } from '../app/ports';

/** Where log lines go: the console, or a spy in tests. */
export type LogSink = Pick<Console, 'warn' | 'error'>;

const PREFIX = '[SiteMark]';

/** The Logger adapter: every line starts with `[SiteMark]` (D-225). */
export function createConsoleLogger(sink: LogSink = globalThis.console): Logger {
  const line = (message: string, detail: unknown) =>
    detail === undefined ? [`${PREFIX} ${message}`] : [`${PREFIX} ${message}`, detail];
  return {
    warn: (message, detail) => sink.warn(...line(message, detail)),
    error: (message, detail) => sink.error(...line(message, detail)),
  };
}
