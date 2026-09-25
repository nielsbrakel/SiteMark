import type { Permissions, Unsubscribe } from '../ports';

export type InMemoryPermissions = Permissions & {
  /** Origins granted right now, in grant order. */
  readonly granted: readonly string[];
  /** The user grants in the browser's own UI (or a prompt elsewhere): fires onAdded. */
  grant(...origins: string[]): void;
  /** The user revokes in the browser's own UI: fires onRemoved. */
  revoke(...origins: string[]): void;
};

type Listener = (origins: string[]) => void;

function subscribe(listeners: Set<Listener>, listener: Listener): Unsubscribe {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

function notify(listeners: Set<Listener>, origins: string[]): void {
  if (origins.length === 0) return;
  for (const listener of [...listeners]) listener([...origins]);
}

/** A Permissions fake, keeping tests/contracts/permissions-contract.ts. */
export function createInMemoryPermissions(granted: readonly string[] = []): InMemoryPermissions {
  const current = new Set(granted);
  const added = new Set<Listener>();
  const removed = new Set<Listener>();
  const grant = (origins: readonly string[]) => {
    const fresh = [...new Set(origins)].filter((origin) => !current.has(origin));
    for (const origin of fresh) current.add(origin);
    notify(added, fresh);
  };
  const revoke = (origins: readonly string[]) => {
    const gone = [...new Set(origins)].filter((origin) => current.has(origin));
    for (const origin of gone) current.delete(origin);
    notify(removed, gone);
    return gone.length > 0;
  };
  return {
    contains: async (origins) => origins.every((origin) => current.has(origin)),
    getAll: async () => [...current],
    remove: async (origins) => revoke(origins),
    onAdded: (listener) => subscribe(added, listener),
    onRemoved: (listener) => subscribe(removed, listener),
    get granted() {
      return [...current];
    },
    grant: (...origins) => grant(origins),
    revoke: (...origins) => void revoke(origins),
  };
}
