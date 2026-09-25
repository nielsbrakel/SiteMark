import { describe, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import { permissionsContract } from '../../tests/contracts/permissions-contract';
import { fakes } from '../../tests/fakes/install';
import { createInMemoryLogger } from '../app/testing/in-memory-logger';
import { createPermissions, requestOrigins } from './permissions';

const prod = '*://prod.example.com/*';
const test = 'https://test.example.com/*';

describe('REQ-PRIV-002 REQ-PRIV-004 the Permissions adapter keeps the Permissions contract', () => {
  permissionsContract((granted) => {
    fakes().permissions.grant(...granted);
    return {
      permissions: createPermissions(createInMemoryLogger()),
      grantInBrowser: (...origins) => fakes().permissions.grant(...origins),
      revokeInBrowser: (...origins) => fakes().permissions.revoke(...origins),
    };
  });

  it('revokes through permissions.remove (REQ-PRIV-004)', async () => {
    fakes().permissions.grant(prod, test);
    await createPermissions(createInMemoryLogger()).remove([test]);
    expect(fakes().permissions.granted).toEqual([prod]);
  });

  it('ignores permission changes without origins', () => {
    const listener = vi.fn();
    createPermissions(createInMemoryLogger()).onAdded(listener);
    fakes().permissions.api.onAdded.trigger({ permissions: ['alarms'], origins: [] });
    expect(listener).not.toHaveBeenCalled();
  });

  it('turns rejected browser calls into "no" and logs them', async () => {
    const logger = createInMemoryLogger();
    const permissions = createPermissions(logger);
    const invalid = new Error('Invalid value for origin pattern');
    vi.spyOn(browser.permissions, 'contains').mockRejectedValueOnce(invalid);
    vi.spyOn(browser.permissions, 'remove').mockRejectedValueOnce(invalid);
    await expect(permissions.contains(['bad'])).resolves.toBe(false);
    await expect(permissions.remove(['bad'])).resolves.toBe(false);
    expect(logger.entries.map(({ level, detail }) => [level, detail])).toEqual([
      ['warn', invalid],
      ['warn', invalid],
    ]);
  });
});

describe('REQ-PRIV-002 requestOrigins() prompts first and synchronously (D-229)', () => {
  it('calls permissions.request before its caller awaits anything', async () => {
    const pending = requestOrigins([prod, test, prod]);
    expect(fakes().permissions.requests).toEqual([[prod, test]]);
    await expect(pending).resolves.toBe('granted');
    expect(fakes().permissions.granted).toEqual([prod, test]);
  });

  it('reports a denied prompt', async () => {
    fakes().permissions.answerNextRequest('deny');
    await expect(requestOrigins([prod])).resolves.toBe('denied');
    expect(fakes().permissions.granted).toEqual([]);
  });

  it('does not prompt for nothing', async () => {
    await expect(requestOrigins([])).resolves.toBe('granted');
    expect(fakes().permissions.requests).toEqual([]);
  });

  it('reports a failed prompt, whether the browser rejects or throws', async () => {
    const request = vi.spyOn(browser.permissions, 'request');
    request.mockRejectedValueOnce(new Error('This function must be called during a user gesture'));
    await expect(requestOrigins([prod])).resolves.toBe('failed');
    request.mockImplementationOnce(() => {
      throw new Error('permissions.request may only be called from a user input handler');
    });
    await expect(requestOrigins([prod])).resolves.toBe('failed');
  });
});
