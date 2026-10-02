import { act, waitFor } from '@testing-library/react';
import { expect } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import type { Committed } from '../../src/app/command-queue';
import type { InjectionError } from '../../src/app/ports';
import type { MarkThisSiteRequest, TabStatusAnswer } from '../../src/app/protocol';
import type { ErrorCode } from '../../src/core/errors';
import type { SiteMarkState } from '../../src/core/model/schema';
import { ok, type Result } from '../../src/core/result';
import { aState } from '../../src/core/testing/builders';
import { createFakeCommands } from '../fakes/commands';
import { fakes } from '../fakes/install';

// A fake background and a fake current tab for the popup's component tests (T-115…T-121). The
// popup only talks to the background through runtime messages and reads pushed states from
// storage, so both are driven here the way the real background would.

/** A message the popup sent, as it arrived. */
type Received = { readonly type: string; readonly data?: unknown };

export type FakeBackground = {
  readonly received: Received[];
  /** What getState answers. */
  state: SiteMarkState;
  /** What getTabStatus answers. */
  tabStatus: TabStatusAnswer;
  /** What startPicker answers. */
  startPicker: Result<void, InjectionError>;
  /** What markThisSite answers. */
  markThisSite: (request: MarkThisSiteRequest) => Result<Committed, ErrorCode>;
  /** How many permission prompts had started when each message arrived (D-229). */
  readonly promptsBefore: number[];
  /** The background commits a new state: it stores it, and the popup follows storage. */
  commit(state: SiteMarkState): Promise<void>;
  /** The messages of one type, in order. */
  sent(type: string): Received[];
};

const STATE_KEY = 'sitemark:state';

/** Starts a background that answers every page message and records what it got. */
export function fakeBackground(overrides: Partial<FakeBackground> = {}): FakeBackground {
  const background: FakeBackground = {
    received: [],
    state: aState({ siteGroups: [] }),
    tabStatus: 'not-injected',
    startPicker: ok(undefined),
    markThisSite: () => ok({ revision: 1, notices: [] }),
    promptsBefore: [],
    commit: (state) =>
      act(async () => {
        background.state = state;
        await fakeBrowser.storage.local.set({ [STATE_KEY]: state });
      }),
    sent: (type) => background.received.filter((message) => message.type === type),
    ...overrides,
  };
  const answer = ({ type, data }: Received): unknown => {
    switch (type) {
      case 'getState':
        return background.state;
      case 'getTabStatus':
        return background.tabStatus;
      case 'startPicker':
        return background.startPicker;
      case 'markThisSite':
        return background.markThisSite(data as MarkThisSiteRequest);
      case 'toggleHidden':
        // Like the marker: "Hide on this tab" flips, where a marker runs (REQ-RND-008).
        if (typeof background.tabStatus === 'object') {
          background.tabStatus = { ...background.tabStatus, hidden: !background.tabStatus.hidden };
        }
        return undefined;
      default:
        return undefined;
    }
  };
  fakeBrowser.runtime.onMessage.addListener((message: Received, _sender, sendResponse) => {
    background.received.push(message);
    background.promptsBefore.push(fakes().permissions.requests.length);
    sendResponse(ok(answer(message)));
    return true;
  });
  return background;
}

/**
 * Waits until `query` finds something and returns it. Unlike `findBy…`, a timeout fails with an
 * assertion, which is how a red test must fail (verify-tdd).
 */
export async function shown<T>(query: () => T | null): Promise<T> {
  let found: T | null = null;
  await waitFor(() => {
    found = query();
    expect(found).not.toBeNull();
  });
  return found as T;
}

/** Opens `url` in the active tab of a focused window (no URL: the browser withholds it). */
export async function activeTab(url?: string): Promise<number> {
  await fakeBrowser.windows.create({ focused: true });
  const tab = await fakeBrowser.tabs.create(
    url === undefined ? { active: true } : { url, active: true },
  );
  if (tab.id === undefined) throw new Error('The fake browser created a tab without an id');
  return tab.id;
}

/** The keyboard shortcuts the browser reports; `''` is an unassigned command (D-208). */
export function shortcuts(assigned: Record<string, string>): void {
  const commands = createFakeCommands(
    Object.entries(assigned).map(([name, shortcut]) => ({ name, shortcut })),
  );
  Object.defineProperty(fakeBrowser, 'commands', {
    value: commands.api,
    configurable: true,
    writable: true,
  });
}
