import { notImplemented } from '../../src/core/not-implemented.ts';

export type Outcome = { passed: number; failed: number; unexpected: string[] };

export function vitestOutcome(_report: unknown): Outcome {
  return notImplemented();
}

export function playwrightOutcome(_report: unknown): Outcome {
  return notImplemented();
}
