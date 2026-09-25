import { notImplemented } from '../../core/not-implemented';
import type { Logger } from '../ports';

export type LogEntry = {
  readonly level: 'warn' | 'error';
  readonly message: string;
  readonly detail?: unknown;
};

export type InMemoryLogger = Logger & { readonly entries: readonly LogEntry[] };

export function createInMemoryLogger(): InMemoryLogger {
  return notImplemented();
}
