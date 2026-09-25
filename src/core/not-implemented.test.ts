import { describe, expect, it } from 'vitest';
import { NotImplementedError, notImplemented } from './not-implemented';

describe('REQ-NFR-004 red-phase stubs throw a recognizable error', () => {
  it('throws NotImplementedError', () => {
    expect(() => notImplemented()).toThrow(NotImplementedError);
  });
});
