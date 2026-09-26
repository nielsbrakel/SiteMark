import { describe, expect, it } from 'vitest';
import type { MarkId, SiteGroupId } from '../ids';
import { emptyState } from '../model/defaults';
import { parseState } from '../model/schema';
import { err } from '../result';
import { anElementMark, aPageMark, aSiteGroup, aWildcardPattern } from '../testing/builders';
import { frozen, stateWith } from '../testing/reducers';
import { fixedIdGen } from '../testing/test-doubles';
import { applyCommand } from './apply-command';
import type { Command, CommandNotice, CommandOf, CommandOutcome } from './command';

const pattern = aWildcardPattern();
const exclude = aWildcardPattern({ value: 'https://prod.example.com/health' });
const [first, second] = [aPageMark(), anElementMark()];
const prod = aSiteGroup({
  name: 'Production',
  enabled: true,
  patterns: [pattern],
  excludes: [exclude],
  marks: [first, second],
});
const test = aSiteGroup({ name: 'Test', enabled: false, patterns: [] });
const state = stateWith(prod, test);

const { id: _id, ...elementDraft } = anElementMark({ label: 'Save button' });
const draft = (value: string) => ({ kind: 'wildcard', value }) as const;
const groupIds = (outcome: CommandOutcome) => outcome.state.siteGroups.map((group) => group.id);
const lastGroup = (outcome: CommandOutcome) => outcome.state.siteGroups.at(-1);
const prodIn = (outcome: CommandOutcome) =>
  outcome.state.siteGroups.find((group) => group.id === prod.id);
const values = (patterns: readonly { value: string }[] = []) => patterns.map((p) => p.value);
const markIds = (outcome: CommandOutcome) => prodIn(outcome)?.marks.map((mark) => mark.id);

type Example<T extends Command['type']> = {
  command: CommandOf<T>;
  check: (outcome: CommandOutcome) => void;
  notices?: CommandNotice[];
};

// One example per command type: a new command is a type error here until it has one.
const examples: { [T in Command['type']]: Example<T> } = {
  createSiteGroup: {
    command: { type: 'createSiteGroup', name: 'Staging' },
    check: (o) => expect(lastGroup(o)?.name).toBe('Staging'),
  },
  renameSiteGroup: {
    command: { type: 'renameSiteGroup', id: prod.id, name: 'Live' },
    check: (o) => expect(prodIn(o)?.name).toBe('Live'),
  },
  deleteSiteGroup: {
    command: { type: 'deleteSiteGroup', id: test.id },
    check: (o) => expect(groupIds(o)).toEqual([prod.id]),
  },
  setSiteGroupEnabled: {
    command: { type: 'setSiteGroupEnabled', id: prod.id, enabled: false },
    check: (o) => expect(prodIn(o)?.enabled).toBe(false),
  },
  moveSiteGroup: {
    command: { type: 'moveSiteGroup', id: test.id, toIndex: 0 },
    check: (o) => expect(groupIds(o)).toEqual([test.id, prod.id]),
  },
  duplicateSiteGroup: {
    command: { type: 'duplicateSiteGroup', id: prod.id },
    check: (o) => expect(lastGroup(o)?.name).toBe('Production copy'),
  },
  addPattern: {
    command: { type: 'addPattern', groupId: prod.id, draft: draft('test.example.com') },
    check: (o) =>
      expect(values(prodIn(o)?.patterns)).toEqual([pattern.value, '*://test.example.com/*']),
  },
  updatePattern: {
    command: {
      type: 'updatePattern',
      groupId: prod.id,
      patternId: pattern.id,
      draft: draft('test.example.com'),
    },
    check: (o) => expect(values(prodIn(o)?.patterns)).toEqual(['*://test.example.com/*']),
  },
  removePattern: {
    command: { type: 'removePattern', groupId: prod.id, patternId: pattern.id },
    check: (o) => expect(prodIn(o)).toMatchObject({ enabled: false, patterns: [] }),
    notices: ['siteGroupAutoDisabled'],
  },
  addExclude: {
    command: { type: 'addExclude', groupId: prod.id, draft: draft('test.example.com') },
    check: (o) =>
      expect(values(prodIn(o)?.excludes)).toEqual([exclude.value, '*://test.example.com/*']),
  },
  updateExclude: {
    command: {
      type: 'updateExclude',
      groupId: prod.id,
      patternId: exclude.id,
      draft: draft('test.example.com'),
    },
    check: (o) => expect(values(prodIn(o)?.excludes)).toEqual(['*://test.example.com/*']),
  },
  removeExclude: {
    command: { type: 'removeExclude', groupId: prod.id, patternId: exclude.id },
    check: (o) => expect(prodIn(o)?.excludes).toEqual([]),
  },
  addMark: {
    command: { type: 'addMark', groupId: prod.id, mark: elementDraft },
    check: (o) => expect(markIds(o)).toEqual([first.id, second.id, 'mark00000001']),
  },
  updateMark: {
    command: { type: 'updateMark', groupId: prod.id, markId: first.id, mark: elementDraft },
    check: (o) => expect(prodIn(o)?.marks[0]).toEqual({ ...elementDraft, id: first.id }),
  },
  removeMark: {
    command: { type: 'removeMark', groupId: prod.id, markId: first.id },
    check: (o) => expect(markIds(o)).toEqual([second.id]),
  },
  moveMark: {
    command: { type: 'moveMark', groupId: prod.id, markId: second.id, toIndex: 0 },
    check: (o) => expect(markIds(o)).toEqual([second.id, first.id]),
  },
  markThisSite: {
    command: { type: 'markThisSite', origin: { hostname: 'test.example.com', port: '' } },
    check: (o) => expect(lastGroup(o)?.name).toBe('test.example.com'),
  },
  setTheme: {
    command: { type: 'setTheme', theme: 'dark' },
    check: (o) => expect(o.state.settings.theme).toBe('dark'),
  },
};

describe('REQ-SEC-001 applyCommand runs every command through its reducer', () => {
  it.each(Object.entries(examples))('%s: applies it and bumps the revision by 1', (_type, e) => {
    const result = applyCommand(state, e.command, { idGen: fixedIdGen() });
    if (!result.ok) return expect.fail(`expected ok, got ${result.error}`);
    expect(result.value.state.revision).toBe(8);
    expect(result.value.notices).toEqual(e.notices ?? []);
    expect(parseState(result.value.state)).toEqual({ ok: true, value: result.value.state });
    e.check(result.value);
  });
});

describe('REQ-SEC-001 applyCommand validates the new state before it can be saved', () => {
  it('counts revisions from the empty state', () => {
    const result = applyCommand(frozen(emptyState()), examples.setTheme.command, {
      idGen: fixedIdGen(),
    });
    expect(result).toEqual({
      ok: true,
      value: { state: { ...emptyState(), revision: 1, settings: { theme: 'dark' } }, notices: [] },
    });
  });

  it('passes a refusal through and bumps nothing', () => {
    const command = { type: 'setSiteGroupEnabled', id: test.id, enabled: true } as const;
    expect(applyCommand(state, command, { idGen: fixedIdGen() })).toEqual(
      err('siteGroupNeedsPattern'),
    );
  });

  it('refuses a result with duplicate IDs (a colliding ID generator)', () => {
    const idGen = { ...fixedIdGen(), markId: (): MarkId => first.id };
    expect(applyCommand(state, examples.addMark.command, { idGen })).toEqual(
      err('commandProducedInvalidState'),
    );
  });

  it('refuses a result with a malformed ID', () => {
    const idGen = { ...fixedIdGen(), siteGroupId: () => 'not an id' as SiteGroupId };
    expect(applyCommand(state, examples.createSiteGroup.command, { idGen })).toEqual(
      err('commandProducedInvalidState'),
    );
  });
});
