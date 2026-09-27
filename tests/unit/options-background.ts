import { fakeBrowser } from 'wxt/testing/fake-browser';
import type { ImportMode } from '../../src/app/protocol';
import { applyCommand } from '../../src/core/commands/apply-command';
import type { Command } from '../../src/core/commands/command';
import { parseCommand } from '../../src/core/commands/command-schema';
import { parseImport } from '../../src/core/data/import';
import { mergeImport, previewImport, replaceImport } from '../../src/core/data/merge-import';
import type { ErrorCode } from '../../src/core/errors';
import type { SiteMarkState } from '../../src/core/model/schema';
import { err, ok } from '../../src/core/result';
import { fixedIdGen } from '../../src/core/testing/test-doubles';

// A stand-in for the background in options page tests (T-123…): it answers getState, applies each
// command with the real reducers and previews and applies imports with the real core functions,
// then stores the result like the queue does, so the page's useSiteMarkState sees it through
// storage.local.onChanged.

const STATE_KEY = 'sitemark:state';

type Envelope = { readonly type?: unknown; readonly data?: unknown };
type ImportMessage = { readonly text: string; readonly mode?: ImportMode };

export type OptionsBackground = {
  /** Every valid command the page sent, in order. */
  readonly commands: readonly Command[];
  /** The mode of every importApply the page sent, in order. */
  readonly imports: readonly ImportMode[];
  /** The state as stored right now. */
  state(): SiteMarkState;
  /** Refuses the next command with `code`, as if the state changed in another window. */
  refuseNext(code: ErrorCode): void;
};

export function optionsBackground(initial: SiteMarkState): OptionsBackground {
  let state = initial;
  let refusal: ErrorCode | undefined;
  const commands: Command[] = [];
  const imports: ImportMode[] = [];
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
    await store(applied.value.state);
    return ok(ok({ revision: state.revision, notices: applied.value.notices }));
  }

  async function store(next: SiteMarkState) {
    state = next;
    await fakeBrowser.storage.local.set({ [STATE_KEY]: state });
  }

  /** Like previewImportFile: the counts, the regexes and the new origins that aren't granted. */
  async function previewFile({ text }: ImportMessage) {
    const data = parseImport(text);
    if (!data.ok) return ok(data);
    const { newOrigins, ...counts } = previewImport(state, data.value);
    const granted = await Promise.all(
      newOrigins.map((origin) => fakeBrowser.permissions.contains({ origins: [origin] })),
    );
    return ok(ok({ ...counts, originsToRequest: newOrigins.filter((_, i) => !granted[i]) }));
  }

  /** Like applyImportFile: parse again, then merge or replace and store the next revision. */
  async function applyFile({ text, mode = 'merge' }: ImportMessage) {
    imports.push(mode);
    const data = parseImport(text);
    if (!data.ok) return ok(data);
    const next =
      mode === 'replace'
        ? ok(replaceImport(state, data.value))
        : mergeImport(state, data.value, { idGen });
    if (!next.ok) return ok(err({ code: next.error }));
    await store({ ...next.value, revision: state.revision + 1 });
    return ok(ok({ revision: state.revision, notices: [] }));
  }

  async function answer(message: Envelope) {
    if (message.type === 'getState') return ok(state);
    if (message.type === 'command') return apply(message.data);
    if (message.type === 'importPreview') return previewFile(message.data as ImportMessage);
    if (message.type === 'importApply') return applyFile(message.data as ImportMessage);
    return err('messageRefused');
  }

  fakeBrowser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    void answer(message as Envelope).then(sendResponse);
    return true;
  });

  return {
    commands,
    imports,
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
