import { fakeBrowser } from 'wxt/testing/fake-browser';
import { applyCommand } from '../../src/core/commands/apply-command';
import type { Command } from '../../src/core/commands/command';
import { parseCommand } from '../../src/core/commands/command-schema';
import type { ErrorCode } from '../../src/core/errors';
import type { SiteMarkState } from '../../src/core/model/schema';
import { err, ok } from '../../src/core/result';
import { fixedIdGen } from '../../src/core/testing/test-doubles';

// A stand-in for the background in options page tests (T-123…): it answers getState and applies
// each command with the real reducers, then stores the result like the queue does, so the page's
// useSiteMarkState sees it through storage.local.onChanged.

const STATE_KEY = 'sitemark:state';

type Envelope = { readonly type?: unknown; readonly data?: unknown };

export type OptionsBackground = {
  /** Every valid command the page sent, in order. */
  readonly commands: readonly Command[];
  /** The state as stored right now. */
  state(): SiteMarkState;
  /** Refuses the next command with `code`, as if the state changed in another window. */
  refuseNext(code: ErrorCode): void;
};

export function optionsBackground(initial: SiteMarkState): OptionsBackground {
  let state = initial;
  let refusal: ErrorCode | undefined;
  const commands: Command[] = [];
  const idGen = fixedIdGen();

  async function apply(input: unknown) {
    const parsed = parseCommand(input);
    if (!parsed.ok) return err('messageRefused');
    commands.push(parsed.value);
    const code = refusal;
    refusal = undefined;
    if (code) return ok(err(code));
    const applied = applyCommand(state, parsed.value, { idGen });
    if (!applied.ok) return ok(applied);
    state = applied.value.state;
    await fakeBrowser.storage.local.set({ [STATE_KEY]: state });
    return ok(ok({ revision: state.revision, notices: applied.value.notices }));
  }

  async function answer(message: Envelope) {
    if (message.type === 'getState') return ok(state);
    if (message.type === 'command') return apply(message.data);
    return err('messageRefused');
  }

  fakeBrowser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    void answer(message as Envelope).then(sendResponse);
    return true;
  });

  return {
    commands,
    state: () => state,
    refuseNext: (code) => {
      refusal = code;
    },
  };
}

/** Opens the options page at `hash` (e.g. `#/settings`) without a hashchange event. */
export function atHash(hash: string): void {
  history.replaceState(null, '', `${location.pathname}${hash}`);
}
