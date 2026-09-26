import { describe, expect, it } from 'vitest';
import { permissionsContract } from '../../tests/contracts/permissions-contract';
import { type StateRepoSeed, stateRepoContract } from '../../tests/contracts/state-repo-contract';
import corruptFixture from '../../tests/fixtures/state/corrupt.json';
import { emptyState } from '../core/model/defaults';
import { aState } from '../core/testing/builders';
import type { LoadedState, StateBackup } from './ports';
import { createInMemoryBadge } from './testing/in-memory-badge';
import { createInMemoryLogger } from './testing/in-memory-logger';
import { createInMemoryPermissions } from './testing/in-memory-permissions';
import { createInMemoryScriptRegistrar } from './testing/in-memory-script-registrar';
import { createInMemoryStateRepo } from './testing/in-memory-state-repo';
import { createInMemoryTabs } from './testing/in-memory-tabs';

const backup = (slot: StateBackup['slot'], savedAt: number, raw: unknown): StateBackup => ({
  slot,
  savedAt,
  raw,
});

const seeds: Record<StateRepoSeed, LoadedState> = {
  fresh: { mode: 'normal', state: emptyState() },
  unreadable: { mode: 'recovered', state: emptyState(), backup: backup(0, 1000, corruptFixture) },
  newer: { mode: 'readOnly', state: emptyState(), schemaVersion: 2 },
};

describe('REQ-NFR-004 the in-memory StateRepo keeps the StateRepo contract', () => {
  stateRepoContract(async (seed) => createInMemoryStateRepo({ loaded: seeds[seed] }));

  it('records accepted saves and fails the next save on request', async () => {
    const repo = createInMemoryStateRepo();
    const first = aState({ revision: 1 });
    await repo.save(first);
    repo.failNextSave();
    await expect(repo.save(aState({ revision: 2 }))).resolves.toEqual({
      ok: false,
      error: 'storageFailed',
    });
    expect(repo.saves).toEqual([first]);
    await expect(repo.load()).resolves.toEqual({ mode: 'normal', state: first });
  });

  it('lists the given backups newest first', async () => {
    const older = backup(2, 1000, { schemaVersion: 'x' });
    const newer = backup(0, 2000, null);
    const repo = createInMemoryStateRepo({ backups: [older, newer] });
    await expect(repo.backups()).resolves.toEqual([newer, older]);
  });
});

describe('REQ-NFR-004 the in-memory Permissions keep the Permissions contract', () => {
  permissionsContract((granted) => {
    const permissions = createInMemoryPermissions(granted);
    return {
      permissions,
      grantInBrowser: (...origins) => permissions.grant(...origins),
      revokeInBrowser: (...origins) => permissions.revoke(...origins),
    };
  });

  it('exposes the granted origins to assertions', () => {
    const permissions = createInMemoryPermissions(['*://a.example.com/*']);
    permissions.grant('*://b.example.com/*', '*://a.example.com/*');
    expect(permissions.granted).toEqual(['*://a.example.com/*', '*://b.example.com/*']);
  });
});

describe('REQ-NFR-004 the in-memory ScriptRegistrar fails like the browser', () => {
  const marker = { matches: ['*://prod.example.com/*'] };

  it('registers, updates and unregisters the marker', async () => {
    const registrar = createInMemoryScriptRegistrar();
    await expect(registrar.getRegistered()).resolves.toBeUndefined();
    await expect(registrar.register(marker)).resolves.toEqual({ ok: true, value: undefined });
    await expect(registrar.getRegistered()).resolves.toEqual(marker);
    const updated = { matches: ['*://a.example.com/*', '*://b.example.com/*'] };
    await expect(registrar.update(updated)).resolves.toEqual({ ok: true, value: undefined });
    expect(registrar.current).toEqual(updated);
    await expect(registrar.unregister()).resolves.toEqual({ ok: true, value: undefined });
    expect(registrar.current).toBeUndefined();
  });

  it('refuses a second register and an update or unregister of nothing', async () => {
    const failed = { ok: false, error: 'registrationFailed' };
    const registered = createInMemoryScriptRegistrar(marker);
    await expect(registered.register(marker)).resolves.toEqual(failed);
    const empty = createInMemoryScriptRegistrar();
    await expect(empty.update(marker)).resolves.toEqual(failed);
    await expect(empty.unregister()).resolves.toEqual(failed);
  });

  it('keeps its own copy of the matches', async () => {
    const matches = ['*://prod.example.com/*'];
    const registrar = createInMemoryScriptRegistrar();
    await registrar.register({ matches });
    matches.push('*://other.example.com/*');
    await expect(registrar.getRegistered()).resolves.toEqual(marker);
  });
});

describe('REQ-NFR-004 the in-memory Tabs only see what the background may see', () => {
  const prod = 'https://prod.example.com/';

  it('lists tabs with URLs only where SiteMark may see them, and finds the active one', async () => {
    const tabs = createInMemoryTabs([
      { id: 1, url: prod },
      { id: 2, active: true },
    ]);
    await expect(tabs.list()).resolves.toEqual([{ id: 1, url: prod }, { id: 2 }]);
    await expect(tabs.active()).resolves.toEqual({ id: 2 });
    await expect(createInMemoryTabs([{ id: 1 }]).active()).resolves.toBeUndefined();
  });

  it('delivers messages only to tabs with a content script', async () => {
    const tabs = createInMemoryTabs([{ id: 1, injected: true }, { id: 2 }]);
    tabs.respondWith(1, (message) => ({ echo: message }));
    await expect(tabs.sendMessage(1, 'ping')).resolves.toEqual({
      ok: true,
      value: { echo: 'ping' },
    });
    await expect(tabs.sendMessage(2, 'ping')).resolves.toEqual({ ok: false, error: 'noReceiver' });
    await expect(tabs.sendMessage(9, 'ping')).resolves.toEqual({ ok: false, error: 'noReceiver' });
    expect(tabs.sent).toEqual([{ tabId: 1, message: 'ping' }]);
  });

  it('injects into ordinary tabs, which then receive messages, and fails on restricted ones', async () => {
    const tabs = createInMemoryTabs([{ id: 1 }, { id: 2, restricted: true }]);
    await expect(tabs.inject(1, ['content.js'])).resolves.toEqual({ ok: true, value: undefined });
    await expect(tabs.sendMessage(1, 'ping')).resolves.toEqual({ ok: true, value: undefined });
    const failed = { ok: false, error: 'injectionFailed' };
    await expect(tabs.inject(2, ['content.js'])).resolves.toEqual(failed);
    await expect(tabs.inject(9, ['content.js'])).resolves.toEqual(failed);
    expect(tabs.injections).toEqual([{ tabId: 1, files: ['content.js'] }]);
  });

  it('records the tabs it opens', async () => {
    const tabs = createInMemoryTabs();
    await tabs.create('options.html#/groups');
    expect(tabs.created).toEqual(['options.html#/groups']);
  });
});

describe('REQ-NFR-004 the in-memory Badge and Logger record what they are given', () => {
  it('keeps a badge text per tab', async () => {
    const badge = createInMemoryBadge();
    await badge.setText(1, '!');
    await badge.setText(2, '✕');
    await badge.setText(2, '');
    expect([badge.textOf(1), badge.textOf(2), badge.textOf(3)]).toEqual(['!', '', '']);
  });

  it('records log entries in order', () => {
    const logger = createInMemoryLogger();
    const cause = new Error('quota');
    logger.warn('Storage access level not set');
    logger.error('Saving failed', cause);
    expect(logger.entries).toEqual([
      { level: 'warn', message: 'Storage access level not set' },
      { level: 'error', message: 'Saving failed', detail: cause },
    ]);
  });
});
