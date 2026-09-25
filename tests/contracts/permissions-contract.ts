import { expect, it, vi } from 'vitest';
import type { Permissions } from '../../src/app/ports';

export type PermissionsSetup = (granted: string[]) => {
  permissions: Permissions;
  /** The user grants in the browser's own UI (Safari, site settings). */
  grantInBrowser(...origins: string[]): void;
  /** The user revokes in the browser's own UI. */
  revokeInBrowser(...origins: string[]): void;
};

const prod = '*://prod.example.com/*';
const test = 'https://test.example.com/*';

/** The Permissions port's contract (REQ-NFR-004): the in-memory fake and the adapter both keep it. */
export function permissionsContract(setup: PermissionsSetup): void {
  it('answers contains() live, never from a cache', async () => {
    const { permissions, grantInBrowser, revokeInBrowser } = setup([prod]);
    await expect(permissions.contains([prod])).resolves.toBe(true);
    await expect(permissions.contains([prod, test])).resolves.toBe(false);
    await expect(permissions.contains([])).resolves.toBe(true);
    revokeInBrowser(prod);
    await expect(permissions.contains([prod])).resolves.toBe(false);
    grantInBrowser(prod, test);
    await expect(permissions.contains([prod, test])).resolves.toBe(true);
  });

  it('lists the granted origins', async () => {
    const { permissions } = setup([prod, test]);
    await expect(permissions.getAll()).resolves.toEqual([prod, test]);
  });

  it('revokes origins and says whether anything was removed', async () => {
    const { permissions } = setup([prod, test]);
    await expect(permissions.remove([prod])).resolves.toBe(true);
    await expect(permissions.getAll()).resolves.toEqual([test]);
    await expect(permissions.remove([prod])).resolves.toBe(false);
  });

  it('reports added and removed origins until the listener unsubscribes', async () => {
    const { permissions, grantInBrowser, revokeInBrowser } = setup([prod]);
    const added = vi.fn();
    const removed = vi.fn();
    const stopAdded = permissions.onAdded(added);
    const stopRemoved = permissions.onRemoved(removed);
    grantInBrowser(test);
    revokeInBrowser(test);
    await permissions.remove([prod]);
    expect(added.mock.calls).toEqual([[[test]]]);
    expect(removed.mock.calls).toEqual([[[test]], [[prod]]]);
    stopAdded();
    stopRemoved();
    grantInBrowser(prod);
    revokeInBrowser(prod);
    expect(added).toHaveBeenCalledOnce();
    expect(removed).toHaveBeenCalledTimes(2);
  });
}
