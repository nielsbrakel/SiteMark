import { createEvent, type FakeEvent } from './event';

export type Permissions = { permissions?: string[]; origins?: string[] };

export type FakePermissionsApi = {
  request(permissions: Permissions): Promise<boolean>;
  contains(permissions: Permissions): Promise<boolean>;
  remove(permissions: Permissions): Promise<boolean>;
  getAll(): Promise<Required<Permissions>>;
  onAdded: FakeEvent<[Required<Permissions>]>;
  onRemoved: FakeEvent<[Required<Permissions>]>;
};

export type FakePermissions = {
  api: FakePermissionsApi;
  /** Origins granted right now, in grant order. */
  readonly granted: readonly string[];
  /** Origins of every `request()` call, in order. */
  readonly requests: readonly (readonly string[])[];
  /** The user's answer to the next prompt. Later prompts are granted again. */
  answerNextRequest(answer: 'grant' | 'deny'): void;
  /** The user grants in the browser's own UI (Safari, site settings). */
  grant(...origins: string[]): void;
  /** The user revokes in the browser's own UI. */
  revoke(...origins: string[]): void;
};

export function createFakePermissions(options: { granted?: string[] } = {}): FakePermissions {
  const granted = new Set(options.granted);
  const requests: string[][] = [];
  let nextAnswer: 'grant' | 'deny' = 'grant';
  const onAdded = createEvent<[Required<Permissions>]>();
  const onRemoved = createEvent<[Required<Permissions>]>();

  const add = (origins: string[]) => {
    const added = origins.filter((origin) => !granted.has(origin));
    for (const origin of added) granted.add(origin);
    if (added.length) onAdded.trigger({ permissions: [], origins: added });
  };
  const drop = (origins: string[]) => {
    const removed = origins.filter((origin) => granted.has(origin));
    for (const origin of removed) granted.delete(origin);
    if (removed.length) onRemoved.trigger({ permissions: [], origins: removed });
    return removed.length > 0;
  };

  const api: FakePermissionsApi = {
    request: async ({ origins = [] }) => {
      requests.push(origins);
      const answer = nextAnswer;
      nextAnswer = 'grant';
      if (answer === 'deny') return false;
      add(origins);
      return true;
    },
    contains: async ({ origins = [] }) => origins.every((origin) => granted.has(origin)),
    remove: async ({ origins = [] }) => drop(origins),
    getAll: async () => ({ permissions: [], origins: [...granted] }),
    onAdded,
    onRemoved,
  };

  return {
    api,
    get granted() {
      return [...granted];
    },
    requests,
    answerNextRequest: (answer) => {
      nextAnswer = answer;
    },
    grant: (...origins) => add(origins),
    revoke: (...origins) => void drop(origins),
  };
}
