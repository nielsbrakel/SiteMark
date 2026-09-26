import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyState } from '../../core/model/defaults';
import type { SiteMarkState } from '../../core/model/schema';
import { compose } from '../../core/render/compose';
import { emptyPlan } from '../../core/render/render-plan';
import { aPageMark, aSiteGroup, aState, aWildcardPattern } from '../../core/testing/builders';
import { fixedIdGen } from '../../core/testing/test-doubles';
import { createCommandQueue } from '../command-queue';
import type { LoadedState } from '../ports';
import { createInMemoryLogger } from '../testing/in-memory-logger';
import { createInMemoryStateRepo } from '../testing/in-memory-state-repo';
import { createInMemoryTabs } from '../testing/in-memory-tabs';
import { pushPlans, renderPlanFor } from './render-plan';

const PROD = 'https://prod.example.com/orders/7?tab=2';
const TEST = 'https://test.example.com/';

const ribbon = (text: string) => aPageMark({ effects: { ribbon: { text, corner: 'top-left' } } });

const prod = aSiteGroup({ name: 'Production', marks: [ribbon('PROD')] });
const test = aSiteGroup({
  name: 'Secret test group',
  patterns: [aWildcardPattern({ value: 'https://test.example.com/*' })],
  marks: [ribbon('TEST-ONLY')],
});
const disabled = aSiteGroup({ name: 'Old', enabled: false, marks: [ribbon('DISABLED')] });
const state: SiteMarkState = aState({ revision: 3, siteGroups: [prod, test, disabled] });

const repoWith = (loaded: LoadedState) => createInMemoryStateRepo({ loaded });

describe('REQ-SEC-002 a content script gets the render plan for its own URL and nothing else', () => {
  it('composes the plan for the URL from the stored state', async () => {
    const repo = repoWith({ mode: 'normal', state });
    await expect(renderPlanFor(repo, PROD)).resolves.toEqual(compose(PROD, state));
    await expect(renderPlanFor(repo, TEST)).resolves.toEqual(compose(TEST, state));
    await expect(renderPlanFor(repo, 'https://elsewhere.example/')).resolves.toEqual(emptyPlan());
  });

  it('leaves out other groups, names, URL patterns and the rest of the state', async () => {
    const plan = JSON.stringify(await renderPlanFor(repoWith({ mode: 'normal', state }), PROD));
    expect(plan).toContain('PROD');
    for (const secret of ['TEST-ONLY', 'DISABLED', 'Secret test group', 'Production']) {
      expect(plan).not.toContain(secret);
    }
    for (const leak of ['example.com', 'siteGroups', 'patterns', 'revision', 'settings']) {
      expect(plan).not.toContain(leak);
    }
  });

  it('renders nothing while the data is read-only', async () => {
    const repo = repoWith({ mode: 'readOnly', state: emptyState(), schemaVersion: 2 });
    await expect(renderPlanFor(repo, PROD)).resolves.toEqual(emptyPlan());
  });
});

describe('REQ-RND-007 REQ-SEC-002 each committed change pushes the new plans to the tabs', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const openTabs = () =>
    createInMemoryTabs([
      { id: 1, url: PROD, injected: true },
      { id: 2, url: TEST, injected: true },
      { id: 3, url: 'https://unrelated.example/', injected: true },
      { id: 4, injected: true },
      { id: 5, url: 'https://prod.example.com/new-tab' },
    ]);

  it('sends every visible tab with a marker exactly its own plan', async () => {
    const tabs = openTabs();
    await pushPlans(tabs, state);
    expect(tabs.sent).toEqual([
      { tabId: 1, message: { type: 'applyPlan', data: compose(PROD, state) } },
      { tabId: 2, message: { type: 'applyPlan', data: compose(TEST, state) } },
      { tabId: 3, message: { type: 'applyPlan', data: emptyPlan() } },
    ]);
  });

  it('pushes right after the commit, without a timer, and in commit order', async () => {
    vi.useFakeTimers();
    const tabs = openTabs();
    const repo = repoWith({ mode: 'normal', state });
    const queue = createCommandQueue({
      repo,
      idGen: fixedIdGen(),
      logger: createInMemoryLogger(),
      onCommitted: (saved) => pushPlans(tabs, saved),
    });
    await queue.dispatch({ type: 'setSiteGroupEnabled', id: prod.id, enabled: false });
    const toProd = () => tabs.sent.filter(({ tabId }) => tabId === 1).map(({ message }) => message);
    expect(toProd()).toEqual([{ type: 'applyPlan', data: emptyPlan() }]);
    await Promise.all([
      queue.dispatch({ type: 'setSiteGroupEnabled', id: prod.id, enabled: true }),
      queue.dispatch({ type: 'renameSiteGroup', id: prod.id, name: 'Live' }),
    ]);
    const final = (await repo.load()).state;
    expect(toProd()).toEqual([
      { type: 'applyPlan', data: emptyPlan() },
      { type: 'applyPlan', data: compose(PROD, final) },
      { type: 'applyPlan', data: compose(PROD, final) },
    ]);
    expect(vi.getTimerCount()).toBe(0);
  });
});
