import { notImplemented } from '../../src/core/not-implemented.ts';

export type Reports = { vitest?: unknown; playwright?: unknown };

export function passingTitles(_reports: Reports): string[] {
  return notImplemented();
}

export function coveredRequirements(_titles: string[]): Set<string> {
  return notImplemented();
}
