import { useRef, useSyncExternalStore } from 'react';
import type { Committed } from '@/app/command-queue';
import type { Command } from '@/core/commands/command';
import type { Result } from '@/core/result';
import { type CommandError, sendCommand } from '@/ui/hooks/use-command';

// The options page's save status (REQ-OPT-006): every change goes through `sendTracked`, and the
// header shows "Saving…" while changes are on their way, then "Saved".

export type SaveStatus = 'idle' | 'saving' | 'saved';

type Snapshot = { readonly status: SaveStatus; readonly changes: number };

let snapshot: Snapshot = { status: 'idle', changes: 0 };
let pending = 0;
const listeners = new Set<() => void>();

function publish(status: SaveStatus): void {
  snapshot = { status, changes: snapshot.changes + 1 };
  for (const listener of listeners) listener();
}

/** `sendCommand` for the options page: the same result, and the save status follows it. */
export async function sendTracked(command: Command): Promise<Result<Committed, CommandError>> {
  pending += 1;
  publish('saving');
  const result = await sendCommand(command);
  pending -= 1;
  // A refusal is explained next to its field or in a toast; the status just stops saying Saving.
  if (pending === 0) publish(result.ok ? 'saved' : 'idle');
  return result;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The status of the changes made since the page (this component) mounted. */
export function useSaveStatus(): SaveStatus {
  const current = useSyncExternalStore(subscribe, () => snapshot);
  const atMount = useRef(current.changes);
  return current.changes > atMount.current ? current.status : 'idle';
}
