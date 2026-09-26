import type { Logger } from '../ports';

export type LogEntry = {
  readonly level: 'warn' | 'error';
  readonly message: string;
  readonly detail?: unknown;
};

export type InMemoryLogger = Logger & { readonly entries: readonly LogEntry[] };

export function createInMemoryLogger(): InMemoryLogger {
  const entries: LogEntry[] = [];
  const log =
    (level: LogEntry['level']) =>
    (message: string, detail?: unknown): void => {
      entries.push(detail === undefined ? { level, message } : { level, message, detail });
    };
  return { warn: log('warn'), error: log('error'), entries };
}
