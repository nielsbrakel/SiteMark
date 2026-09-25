import { describe, expect, it, vi } from 'vitest';
import { createFakePermissions } from './permissions';

const prod = '*://prod.example.com/*';
const test = '*://test.example.com/*';

describe('REQ-NFR-004 fake permissions keep grant state like the browser', () => {
  it('starts with the given grants and answers contains() live', async () => {
    const { api } = createFakePermissions({ granted: [prod] });
    await expect(api.contains({ origins: [prod] })).resolves.toBe(true);
    await expect(api.contains({ origins: [prod, test] })).resolves.toBe(false);
    await expect(api.getAll()).resolves.toEqual({ permissions: [], origins: [prod] });
  });

  it('grants a request by default, logs it and fires onAdded', async () => {
    const fake = createFakePermissions();
    const onAdded = vi.fn();
    fake.api.onAdded.addListener(onAdded);
    await expect(fake.api.request({ origins: [test] })).resolves.toBe(true);
    expect(fake.granted).toEqual([test]);
    expect(fake.requests).toEqual([[test]]);
    expect(onAdded).toHaveBeenCalledWith({ permissions: [], origins: [test] });
  });

  it('denies the next request when told to, then grants again', async () => {
    const fake = createFakePermissions();
    fake.answerNextRequest('deny');
    await expect(fake.api.request({ origins: [test] })).resolves.toBe(false);
    expect(fake.granted).toEqual([]);
    await expect(fake.api.request({ origins: [test] })).resolves.toBe(true);
  });

  it('only fires onAdded for origins that were not granted yet', async () => {
    const fake = createFakePermissions({ granted: [prod] });
    const onAdded = vi.fn();
    fake.api.onAdded.addListener(onAdded);
    await fake.api.request({ origins: [prod] });
    expect(onAdded).not.toHaveBeenCalled();
  });

  it('removes grants through the API or the browser UI and fires onRemoved', async () => {
    const fake = createFakePermissions({ granted: [prod, test] });
    const onRemoved = vi.fn();
    fake.api.onRemoved.addListener(onRemoved);
    await expect(fake.api.remove({ origins: [prod] })).resolves.toBe(true);
    fake.revoke(test);
    expect(fake.granted).toEqual([]);
    expect(onRemoved.mock.calls).toEqual([
      [{ permissions: [], origins: [prod] }],
      [{ permissions: [], origins: [test] }],
    ]);
  });

  it('lets a test grant from the browser UI (Safari) with onAdded', () => {
    const fake = createFakePermissions();
    const onAdded = vi.fn();
    fake.api.onAdded.addListener(onAdded);
    fake.grant(prod);
    expect(fake.granted).toEqual([prod]);
    expect(onAdded).toHaveBeenCalledOnce();
  });
});
