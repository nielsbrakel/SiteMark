import type { BrowserContext } from '@playwright/test';
import type { SiteMarkState } from '../../src/core/model/schema';
import { sendFromPage } from './background';

// Seeds the extension's state the way the options page does: commands sent from an extension
// page to the background, the only storage writer (D-220).

type Reply<T> = { ok: true; value: T } | { ok: false; error: unknown };

/** A mark as the options page sends it (`MarkDraft`, loosely typed for tests). */
export type MarkSeed = Record<string, unknown>;

export type SiteGroupSeed = {
  readonly name?: string;
  /** Wildcard patterns, e.g. `*://prod.sitemark.test/*`. */
  readonly patterns: readonly string[];
  readonly marks: readonly MarkSeed[];
};

/** A page mark with only a ribbon, in the SiteMark red. */
export function aRibbonMark(text: string): MarkSeed {
  return {
    enabled: true,
    color: '#c93a2e',
    textColor: 'auto',
    target: { kind: 'page' },
    effects: { ribbon: { text, corner: 'top-right' } },
  };
}

/** Adds an enabled site group; resolves with the state after the last command. */
export async function seedSiteGroup(
  context: BrowserContext,
  extensionId: string,
  seed: SiteGroupSeed,
): Promise<SiteMarkState> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  const send = async <T>(message: unknown): Promise<T> => {
    const reply = (await sendFromPage(page, message)) as Reply<T>;
    if (!reply.ok) throw new Error(`${JSON.stringify(message)} failed: ${JSON.stringify(reply)}`);
    return reply.value;
  };
  const command = (data: Record<string, unknown>) => send({ type: 'command', data });
  await command({ type: 'createSiteGroup', name: seed.name ?? 'Seeded' });
  const created = (await send<SiteMarkState>({ type: 'getState' })).siteGroups.at(-1);
  if (!created) throw new Error('The site group was not created');
  const groupId = created.id;
  for (const value of seed.patterns) {
    await command({ type: 'addPattern', groupId, draft: { kind: 'wildcard', value } });
  }
  for (const mark of seed.marks) await command({ type: 'addMark', groupId, mark });
  await command({ type: 'setSiteGroupEnabled', id: groupId, enabled: true });
  const state = await send<SiteMarkState>({ type: 'getState' });
  await page.close();
  return state;
}
