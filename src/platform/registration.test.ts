import { describe, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import { fakes } from '../../tests/fakes/install';
import type { RegisteredScript } from '../../tests/fakes/scripting';
import { createInMemoryLogger } from '../app/testing/in-memory-logger';
import { createScriptRegistrar, markerFiles } from './registration';

const PROD = 'https://prod.example.com/*';
const TEST = '*://test.example.com/*';

const marker: RegisteredScript = {
  id: 'sitemark-marker',
  matches: [PROD],
  js: ['content-scripts/content.js'],
  runAt: 'document_start',
  allFrames: false,
  persistAcrossSessions: true,
  world: 'ISOLATED',
};

const setup = () => {
  const logger = createInMemoryLogger();
  return { registrar: createScriptRegistrar(logger), logger };
};

describe('REQ-PRIV-003 the ScriptRegistrar adapter registers the marker dynamically (D-231)', () => {
  it('runs the marker bundle WXT builds for the runtime content script', () => {
    expect(markerFiles()).toEqual(['content-scripts/content.js']);
  });

  it('registers the marker at document_start, top frame only, isolated and persistent', async () => {
    const { registrar } = setup();
    await expect(registrar.register({ matches: [PROD] })).resolves.toEqual({
      ok: true,
      value: undefined,
    });
    expect(fakes().scripting.registered).toEqual([marker]);
    expect(fakes().scripting.registered[0]).not.toHaveProperty('excludeMatches');
  });

  it('reads the registration back', async () => {
    const { registrar } = setup();
    await expect(registrar.getRegistered()).resolves.toBeUndefined();
    await registrar.register({ matches: [PROD, TEST] });
    await expect(registrar.getRegistered()).resolves.toEqual({ matches: [PROD, TEST] });
  });

  it('ignores other registered scripts', async () => {
    await fakes().scripting.api.registerContentScripts([{ id: 'other', matches: [PROD], js: [] }]);
    await expect(setup().registrar.getRegistered()).resolves.toBeUndefined();
  });

  it('updates the matches and every option', async () => {
    const { registrar } = setup();
    await registrar.register({ matches: [PROD] });
    await expect(registrar.update({ matches: [TEST] })).resolves.toEqual({
      ok: true,
      value: undefined,
    });
    expect(fakes().scripting.registered).toEqual([{ ...marker, matches: [TEST] }]);
  });

  it('unregisters only the marker', async () => {
    await fakes().scripting.api.registerContentScripts([{ id: 'other', matches: [PROD], js: [] }]);
    const { registrar } = setup();
    await registrar.register({ matches: [PROD] });
    await expect(registrar.unregister()).resolves.toEqual({ ok: true, value: undefined });
    expect(fakes().scripting.registered.map(({ id }) => id)).toEqual(['other']);
  });

  it('reads a registration with other options (an older build) as having no matches', async () => {
    await fakes().scripting.api.registerContentScripts([
      { ...marker, js: ['content-scripts/old.js'] },
    ]);
    await expect(setup().registrar.getRegistered()).resolves.toEqual({ matches: [] });
  });

  it('turns rejected browser calls into registrationFailed and logs them', async () => {
    const { registrar, logger } = setup();
    await expect(registrar.update({ matches: [PROD] })).resolves.toEqual({
      ok: false,
      error: 'registrationFailed',
    });
    await expect(registrar.unregister()).resolves.toEqual({
      ok: false,
      error: 'registrationFailed',
    });
    await registrar.register({ matches: [PROD] });
    await expect(registrar.register({ matches: [PROD] })).resolves.toEqual({
      ok: false,
      error: 'registrationFailed',
    });
    expect(logger.entries.map(({ level }) => level)).toEqual(['warn', 'warn', 'warn']);
  });

  it('reads a failing lookup as no registration and logs it', async () => {
    const broken = new Error('scripting unavailable');
    vi.spyOn(browser.scripting, 'getRegisteredContentScripts').mockRejectedValueOnce(broken);
    const { registrar, logger } = setup();
    await expect(registrar.getRegistered()).resolves.toBeUndefined();
    expect(logger.entries).toEqual([
      { level: 'warn', message: 'Could not read the marker registration', detail: broken },
    ]);
  });
});
