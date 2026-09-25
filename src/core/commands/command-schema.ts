import type { SchemaResult } from '../model/schema';
import { notImplemented } from '../not-implemented';
import type { Command } from './command';

export function parseCommand(_input: unknown): SchemaResult<Command> {
  return notImplemented();
}
